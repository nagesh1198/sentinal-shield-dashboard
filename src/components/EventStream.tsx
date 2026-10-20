"use client";

import { useState, useEffect, useRef } from "react";
import { dashboardService } from "@/services/dashboardService";
import type { AlertPayload } from "@/lib/types";

const severityDot = (severity?: string) => {
  const s = (severity || "").toLowerCase();
  if (s === "critical" || s === "high") return "bg-error";
  if (s === "medium" || s === "warning") return "bg-amber-500";
  if (s === "low" || s === "info") return "bg-emerald-500";
  return "bg-primary-container";
};

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function EventStream() {
  const [events, setEvents] = useState<AlertPayload[]>([]);
  const [connected, setConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRecentAlerts();
    // Establish real-time SSE stream
    const es = dashboardService.getAlertStream();

    if (es) {
      es.onopen = () => setConnected(true);
      es.onmessage = (event) => {
        try {
          const alert: AlertPayload = JSON.parse(event.data);
          setEvents((prev) => {
            if (prev.some((e) => e.id === alert?.id)) return prev;
            return [alert, ...prev].slice(0, 50);
          });
        } catch {
          // non-JSON keep-alive, ignore
        }
      };
      es.onerror = () => {
        setConnected(false);
        es.close();
      };
    }

    // 5-second polling interval to keep recent alerts continuously updated
    const interval = setInterval(() => {
      loadRecentAlerts();
    }, 5000);

    return () => {
      clearInterval(interval);
      if (es) es.close();
    };
  }, []);

  const loadRecentAlerts = () => {
    dashboardService
      .getAlerts(undefined, 10)
      .then((res) => {
        const raw = res?.data || (Array.isArray(res) ? res : []);
        setEvents(Array.isArray(raw) ? raw : []);
      })
      .catch((err) => {
        console.error("Failed to load alerts:", err);
      });
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_12px_32px_rgba(0,27,133,0.06)] flex flex-col border border-outline-variant/10 h-[252px] max-h-[252px] min-h-[252px] overflow-hidden">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-headline font-bold text-primary">
            Live Event Stream
          </h2>
          <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            {events.length} events
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-error"} animate-pulse`}
            title={connected ? "SSE Connected" : "Polling mode"}
          />
          <span className="text-[10px] font-medium text-slate-400">
            {connected ? "Live" : "Polling"}
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="space-y-2.5 overflow-y-auto overscroll-contain pr-2 flex-1 min-h-0 h-[184px] max-h-[184px] [scrollbar-width:thin] [scrollbar-color:rgba(100,116,139,0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {events.length === 0 && (
          <p className="text-xs text-on-surface-variant/60 text-center py-4">
            No events yet. Waiting for alerts...
          </p>
        )}

        {events.map((alert, idx) => (
          <div
            key={alert.id || `alert-${idx}`}
            className="flex gap-3 items-start pb-3 border-b border-surface-container-high animate-[fadeIn_0.3s_ease-out]"
          >
            <div
              className={`mt-1.5 w-1.5 h-1.5 rounded-full ${severityDot(alert.severity)} shrink-0`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold font-headline uppercase text-on-surface tracking-tight">
                {alert.event_type || "Security Signal"}
              </p>
              <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
                Server: {alert.hostname || (alert.details?.host as string) || alert.server_id || "cluster"} — Severity: {alert?.severity || "info"}
              </p>
              <p className="text-[9px] text-primary/40 mt-1 font-mono">
                {formatTime(alert.detected_at)} | ID: {typeof alert.id === "string" ? alert?.id?.slice(0, 8) : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
