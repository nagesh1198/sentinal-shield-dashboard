"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { ScopePanel } from "./ScopePanel";
import { useAiAnalysis } from "./useAiAnalysis";
import { defaultScope, toQueryBody, validateScope } from "@/lib/aiScope";
import type { ScopeState } from "@/lib/aiScope";
import { serverService } from "@/services/serverService";
import type { ServerResponse } from "@/lib/types";

export function AiAnalysisWorkspace() {
  const [servers, setServers] = useState<ServerResponse[]>([]);
  const [serversLoading, setServersLoading] = useState(true);
  const [serversError, setServersError] = useState<string | null>(null);
  const [scope, setScope] = useState<ScopeState>(defaultScope);
  // Validation messages are computed in event handlers (never during render) and only once the admin tried to send.
  const [errors, setErrors] = useState<string[]>([]);
  const ai = useAiAnalysis();

  const fetchServers = useCallback(() => {
    return serverService
      .listServers()
      .then((data) => {
        const list = (Array.isArray(data) ? data : []).slice().sort((a, b) => a.hostname.localeCompare(b.hostname));
        setServers(list);
        setServersError(null);
        // one server: nothing to choose, so preselect it
        if (list.length === 1) setScope((s) => (s.serverIds.length ? s : { ...s, serverIds: [list[0].id] }));
      })
      .catch((err: Error) => setServersError(err.message || "Request failed"))
      .finally(() => setServersLoading(false));
  }, []);

  useEffect(() => {
    void fetchServers();
  }, [fetchServers]);

  const retryServers = useCallback(() => {
    setServersLoading(true);
    setServersError(null);
    void fetchServers();
  }, [fetchServers]);

  const changeScope = useCallback(
    (next: ScopeState) => {
      setScope(next);
      if (errors.length) setErrors(validateScope(next, Date.now()));
    },
    [errors.length]
  );

  const send = useCallback(
    (question: string, chipRange?: "24h") => {
      const text = question.trim();
      if (!text) return;
      if (ai.locked) {
        void ai.send(text, null);
        return;
      }
      const effective: ScopeState = chipRange ? { ...scope, preset: chipRange } : scope;
      const found = validateScope(effective, Date.now());
      if (found.length > 0) {
        setErrors(found);
        return;
      }
      if (chipRange) setScope(effective);
      setErrors([]);
      void ai.send(text, toQueryBody(effective, text, Date.now()));
    },
    [ai, scope]
  );

  const retry = useCallback(() => {
    const last = [...ai.messages].reverse().find((m) => m.role === "assistant");
    if (!last?.question) return;
    ai.dropLastTurn();
    send(last.question);
  }, [ai, send]);

  const newAnalysis = useCallback(() => {
    ai.reset();
    setErrors([]);
  }, [ai]);

  const exampleServer = servers.find((s) => s.id === scope.serverIds[0])?.hostname ?? servers[0]?.hostname ?? null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:h-[calc(100vh-200px)] lg:min-h-[540px] lg:grid-cols-12">
      <div className="min-h-0 lg:col-span-4 xl:col-span-3">
        <ScopePanel
          servers={servers}
          serversLoading={serversLoading}
          serversError={serversError}
          onRetryServers={retryServers}
          scope={scope}
          onChange={changeScope}
          errors={errors}
          locked={ai.locked}
          onNewAnalysis={newAnalysis}
        />
      </div>
      <div className="min-h-[70vh] lg:col-span-8 lg:min-h-0 xl:col-span-9">
        <ChatPanel
          messages={ai.messages}
          busy={ai.busy}
          locked={ai.locked}
          notice={ai.notice}
          exampleServer={exampleServer}
          onSend={send}
          onStop={ai.stop}
          onRetry={retry}
          onNewAnalysis={newAnalysis}
        />
      </div>
    </div>
  );
}
