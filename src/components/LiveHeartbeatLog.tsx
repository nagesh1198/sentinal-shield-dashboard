"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { nodeService } from "@/services/nodeService";
import { dashboardService } from "@/services/dashboardService";
import type { AlertPayload, NodeInventory } from "@/lib/types";

type Tag = "SYSTEM" | "WATCH" | "DECPTN" | "TRAFFIC" | "AUTH" | "CRYPTO" | "HEARTBEAT" | "ALERT" | "OFFLINE";

interface LogEntry {
  id: string;
  ts: string;
  tag: Tag;
  msg: string;
}

const TAG_STYLE: Record<Tag, string> = {
  SYSTEM: "text-cyan-400",
  WATCH: "text-amber-400",
  DECPTN: "text-emerald-400",
  TRAFFIC: "text-purple-400",
  AUTH: "text-blue-400",
  CRYPTO: "text-rose-400",
  HEARTBEAT: "text-emerald-400 font-semibold",
  ALERT: "text-red-400 font-bold",
  OFFLINE: "text-zinc-500 font-semibold",
};

function formatNow(): string {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface Props {
  nodeId?: string; // if provided, filters telemetry and stream for this node
  intervalMs?: number; // polling frequency for node heartbeat verification
  maxEntries?: number; // how many lines to keep in buffer
  height?: string; // CSS height
}

export function LiveHeartbeatLog({
  nodeId,
  intervalMs = 4000,
  maxEntries = 40,
  height = "220px",
}: Props) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastStateRef = useRef<string>("");

  const appendEntry = useCallback((tag: Tag, msg: string) => {
    setEntries((prev) => {
      const entry: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ts: formatNow(),
        tag,
        msg: nodeId ? `[${nodeId}] ${msg}` : msg,
      };
      return [entry, ...prev].slice(0, maxEntries);
    });
  }, [nodeId, maxEntries]);

  // 1. Live Heartbeat Verification via node telemetry endpoint
  useEffect(() => {
    let active = true;

    async function checkHeartbeat() {
      try {
        const nodes: NodeInventory[] = await nodeService.getNodes();
        if (!active) return;

        if (nodeId) {
          const target = nodes.find((n) => n.id === nodeId);
          if (target) {
            const isOnline = ["online", "active", "healthy"].includes(
              (target.status || "").toLowerCase()
            );
            setConnected(isOnline);

            const cpu = typeof target.cpu === "number" ? Math.round(target.cpu) : 0;
            const mem =
              target.memoryTotal && target.memoryUsed
                ? Math.round((target.memoryUsed / target.memoryTotal) * 100)
                : typeof target.memoryUsed === "number"
                ? Math.round(target.memoryUsed)
                : 0;

            const stateSnapshot = `${target.status}-${cpu}-${mem}-${target.threats}`;

            if (isOnline) {
              appendEntry(
                "HEARTBEAT",
                `Daemon pulse ACK: ${target.status.toUpperCase()} | CPU: ${cpu}% | Mem: ${mem}% | IP: ${target.ip}`
              );

              if (target.threats > 0 && lastStateRef.current !== stateSnapshot) {
                appendEntry(
                  "WATCH",
                  `Active threats flagged: ${target.threats} incident(s) under observation`
                );
              }
            } else {
              appendEntry(
                "OFFLINE",
                `Node status: ${target.status.toUpperCase()} — heartbeat unacknowledged`
              );
            }
            lastStateRef.current = stateSnapshot;
          } else {
            setConnected(false);
            appendEntry("OFFLINE", `Node not found in active cluster registry`);
          }
        } else {
          // Cluster-wide Global Feed
          const onlineNodes = nodes.filter((n) =>
            ["online", "active", "healthy"].includes((n.status || "").toLowerCase())
          );
          setConnected(onlineNodes.length > 0);
          appendEntry(
            "SYSTEM",
            `Cluster telemetry sync: ${onlineNodes.length}/${nodes.length} nodes active and reporting heartbeats`
          );
        }
      } catch (err: any) {
        if (!active) return;
        setConnected(false);
        appendEntry("SYSTEM", `Heartbeat poll failure: ${err.message || "Connection refused"}`);
      }
    }

    // Initial check
    checkHeartbeat();
    const timer = setInterval(checkHeartbeat, Math.max(intervalMs, 3000));

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [nodeId, intervalMs, appendEntry]);

  // 2. Real-Time SSE Stream for security alerts & audit events
  useEffect(() => {
    let sse: EventSource | null = null;
    try {
      sse = dashboardService.getAlertStream();
    } catch {
      // Stream unavailable
    }

    if (sse) {
      sse.onmessage = (event) => {
        try {
          const alert: AlertPayload = JSON.parse(event.data);
          if (!nodeId || alert.server_id === nodeId) {
            appendEntry(
              "ALERT",
              `Real-time alert: ${alert.event_type} [${alert.severity.toUpperCase()}] on server ${alert.server_id}`
            );
          }
        } catch {
          // Ignore keep-alive comments
        }
      };

      sse.onerror = () => {
        // Handled silently; polling continues
      };
    }

    return () => {
      if (sse) sse.close();
    };
  }, [nodeId, appendEntry]);

  return (
    <div className="rounded-xl overflow-hidden border border-white/5" style={{ height }}>
      {/* Header with live dynamic status badge */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#111827] border-b border-white/5">
        <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.15em]">
          {nodeId ? "Live Node Telemetry" : "Cluster Event Feed"}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connected ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
            } inline-block`}
          />
          <span
            className={`text-[9px] font-mono ${
              connected ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            {connected ? "LIVE" : "DISCONNECTED"}
          </span>
        </span>
      </div>

      {/* Log scroll area */}
      <div
        ref={scrollRef}
        className="overflow-y-auto bg-[#0d1117] px-3 py-2 space-y-1 font-mono text-[10px] leading-5"
        style={{ height: `calc(${height} - 34px)` }}
      >
        {entries.length === 0 ? (
          <div className="text-white/40 text-[10px] italic py-2">
            Awaiting live heartbeat from telemetry broker...
          </div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="flex gap-2 animate-[fadeIn_0.3s_ease] items-start">
              <span className="text-white/30 shrink-0 tabular-nums">{e.ts}</span>
              <span className={`font-bold shrink-0 ${TAG_STYLE[e.tag] || "text-white/60"}`}>
                [{e.tag}]
              </span>
              <span className="text-white/80">{e.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
