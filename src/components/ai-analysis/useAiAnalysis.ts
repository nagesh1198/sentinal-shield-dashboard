"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AiRequestError, streamAnalysis } from "@/services/aiAnalysisService";
import type { DataUsed, SseEvent } from "@/lib/ai/types";

export interface ToolActivity {
  name: string;
  status: "running" | "done" | "error";
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "streaming" | "done" | "error" | "stopped";
  phase?: "collecting" | "analysing";
  question?: string;
  dataUsed?: DataUsed;
  truncation?: string[];
  tools: ToolActivity[];
  error?: { code: string; message: string; retryAfter?: number; reason?: string };
  createdAt: number;
}

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}-${Math.random().toString(36).slice(2)}`);

/**
 * Owns the conversation: first message POSTs the whole scope (/query), later messages POST only
 * {session_id, message} (/followup). The server keeps the history; the scope is locked once a session exists.
 */
export function useAiAnalysis() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sessionRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingText = useRef("");
  const rafRef = useRef<number | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const patch = useCallback((id: string, fn: (m: ChatMessage) => ChatMessage) => {
    if (!mounted.current) return;
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
  }, []);

  const flush = useCallback(
    (id: string) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const text = pendingText.current;
      pendingText.current = "";
      if (text) patch(id, (m) => ({ ...m, content: m.content + text, phase: "analysing" }));
    },
    [patch]
  );

  const send = useCallback(
    async (question: string, queryBody: object | null): Promise<void> => {
      if (busy) return;
      const isFollowup = sessionRef.current !== null;
      const body = isFollowup ? { session_id: sessionRef.current, message: question } : queryBody;
      if (!body) return;

      const asstId = uid();
      setNotice(null);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: question, status: "done", tools: [], createdAt: Date.now() },
        { id: asstId, role: "assistant", content: "", status: "streaming", phase: "collecting", question, tools: [], createdAt: Date.now() },
      ]);
      setBusy(true);
      const ac = new AbortController();
      abortRef.current = ac;

      const onEvent = (e: SseEvent) => {
        switch (e.type) {
          case "meta":
            sessionRef.current = e.session_id;
            if (mounted.current) setLocked(true);
            patch(asstId, (m) => ({ ...m, dataUsed: e.data_used, truncation: e.truncation, phase: "analysing" }));
            break;
          case "data_used":
            patch(asstId, (m) => ({ ...m, dataUsed: e.data_used, truncation: e.truncation }));
            break;
          case "tool":
            patch(asstId, (m) => {
              const tools = [...m.tools];
              const i = tools.findIndex((t) => t.name === e.name && t.status === "running");
              const next = { name: e.name, status: e.status, summary: e.summary };
              if (e.status === "running" || i < 0) tools.push(next);
              else tools[i] = next;
              return { ...m, tools };
            });
            break;
          case "delta":
            pendingText.current += e.text;
            if (rafRef.current === null) rafRef.current = requestAnimationFrame(() => flush(asstId));
            break;
          case "done":
            flush(asstId);
            patch(asstId, (m) => ({ ...m, status: "done", phase: undefined }));
            break;
          case "error":
            flush(asstId);
            if (!isFollowup) {
              sessionRef.current = null; // the server discards a failed first turn
              if (mounted.current) setLocked(false);
            }
            patch(asstId, (m) => ({ ...m, status: "error", phase: undefined, error: { code: e.code, message: e.message } }));
            break;
        }
      };

      try {
        await streamAnalysis(isFollowup ? "followup" : "query", body, { signal: ac.signal, onEvent });
      } catch (err) {
        flush(asstId);
        if ((err as { name?: string })?.name === "AbortError") {
          if (!isFollowup) {
            sessionRef.current = null;
            if (mounted.current) setLocked(false);
          }
          patch(asstId, (m) => ({ ...m, status: "stopped", phase: undefined }));
        } else {
          const e = err instanceof AiRequestError ? err : new AiRequestError("internal_error", "Something went wrong. Please try again.");
          if (e.code === "session_not_found") {
            sessionRef.current = null;
            if (mounted.current) {
              setLocked(false);
              setNotice("That conversation expired on the server. Your next question will start a fresh analysis with the scope on the left.");
            }
          }
          patch(asstId, (m) => ({ ...m, status: "error", phase: undefined, error: { code: e.code, message: e.message, retryAfter: e.retryAfter, reason: e.reason } }));
        }
      } finally {
        if (abortRef.current === ac) abortRef.current = null;
        if (mounted.current) setBusy(false);
      }
    },
    [busy, flush, patch]
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    sessionRef.current = null;
    pendingText.current = "";
    setMessages([]);
    setLocked(false);
    setNotice(null);
    setBusy(false);
  }, []);

  /** Drops the last user+assistant pair so the same question can be re-sent cleanly. */
  const dropLastTurn = useCallback(() => setMessages((prev) => prev.slice(0, -2)), []);

  return { messages, busy, locked, notice, send, stop, reset, dropLastTurn };
}
