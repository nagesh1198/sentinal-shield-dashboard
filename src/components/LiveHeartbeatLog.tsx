"use client";

import { useEffect, useState } from "react";

type Tag = "SYSTEM" | "WATCH" | "DECPTN" | "TRAFFIC" | "AUTH" | "CRYPTO";

interface LogEntry {
  id: number;
  ts: string;
  tag: Tag;
  msg: string;
}

const TAG_STYLE: Record<Tag, string> = {
  SYSTEM:  "text-cyan-400",
  WATCH:   "text-amber-400",
  DECPTN:  "text-emerald-400",
  TRAFFIC: "text-purple-400",
  AUTH:    "text-blue-400",
  CRYPTO:  "text-rose-400",
};

/* Pool of realistic events per node */
const EVENT_POOL: { tag: Tag; msgs: string[] }[] = [
  { tag: "SYSTEM",  msgs: ["Sentinel handshake successful", "Daemon heartbeat acknowledged", "Cache layer ping: 1.2ms", "Config sync complete", "Node status broadcast OK"] },
  { tag: "AUTH",    msgs: ["mTLS certificate verified", "AppRole token renewed", "Session key rotated", "Vault lease renewed (TTL: 3600s)", "Access grant: read /secret/sentinel"] },
  { tag: "DECPTN",  msgs: ["Canary token DB-REF-22 rotated", "Honeyfile /etc/shadow.bak checked", "Breadcrumb DNS probe: no hit", "Decoy path /opt/secrets/ undisturbed", "Canary schema heartbeat: intact"] },
  { tag: "TRAFFIC", msgs: ["Heartbeat packet acknowledged", "TCP handshake: 192.168.10.4 → 10.0.4.15", "Kafka producer flush: 0 lag", "Inbound packet rate: 842/s", "Egress bytes: 14.2 KB"] },
  { tag: "WATCH",   msgs: ["Integrity scan: 0 delta", "File watcher check: clean", "Audit log tail: no new events", "eBPF probe: all hooks active", "Process tree snapshot: nominal"] },
  { tag: "CRYPTO",  msgs: ["CRL check passed", "TLS 1.3 session established", "ECDH key exchange: OK", "Cert chain validation: trusted", "Cipher suite: AES-256-GCM-SHA384"] },
];

function now(): string {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function randomEvent(nodeId?: string): LogEntry {
  const pool = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  const msgs = pool.msgs;
  const msg = msgs[Math.floor(Math.random() * msgs.length)];
  return {
    id: Date.now() + Math.random(),
    ts: now(),
    tag: pool.tag,
    msg: nodeId ? `[${nodeId}] ${msg}` : msg,
  };
}

interface Props {
  nodeId?: string;       // if provided, prefixes messages with node name
  intervalMs?: number;   // how fast events fire (default 900ms)
  maxEntries?: number;   // how many lines to keep (default 30)
  height?: string;       // CSS height (default "220px")
}

export function LiveHeartbeatLog({
  nodeId,
  intervalMs = 900,
  maxEntries = 30,
  height = "220px",
}: Props) {
  const [entries, setEntries] = useState<LogEntry[]>(() =>
    Array.from({ length: 8 }, () => randomEvent(nodeId))
  );
  useEffect(() => {
    const t = setInterval(() => {
      setEntries(prev => {
        const next = [randomEvent(nodeId), ...prev];
        return next.slice(0, maxEntries);
      });
    }, intervalMs + Math.random() * 400);
    return () => clearInterval(t);
  }, [nodeId, intervalMs, maxEntries]);

  return (
    <div className="rounded-xl overflow-hidden border border-white/5" style={{ height }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#111827] border-b border-white/5">
        <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.15em]">Live Heartbeat</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span className="text-[9px] text-emerald-400 font-mono">LIVE</span>
        </span>
      </div>

      {/* Log scroll area */}
      <div
        className="overflow-y-auto bg-[#0d1117] px-3 py-2 space-y-1 font-mono text-[10px] leading-5"
        style={{ height: `calc(${height} - 34px)` }}
      >
        {entries.map((e) => (
          <div key={e.id} className="flex gap-2 animate-[fadeIn_0.3s_ease] items-start">
            <span className="text-white/30 shrink-0 tabular-nums">{e.ts}</span>
            <span className={`font-bold shrink-0 ${TAG_STYLE[e.tag]}`}>[{e.tag}]</span>
            <span className="text-white/70">{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
