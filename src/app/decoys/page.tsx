"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { decoyService } from "@/services/decoyService";
import type { DecoyResponse } from "@/lib/types";
import {
  Ghost, FolderOpen, Eye, ShieldAlert, ShieldCheck,
  RefreshCw, Loader2, AlertTriangle, FileCode, CheckCircle2, Lock
} from "lucide-react";

function getBasename(path: string): string {
  if (!path) return "Unnamed Asset";
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

function getDecoyTypeIcon(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("process")) return Ghost;
  if (t.includes("dir") || t.includes("folder")) return FolderOpen;
  return FileCode;
}

export default function DecoysPage() {
  const [items, setItems] = useState<DecoyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "compromised">("all");

  const loadDecoys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await decoyService.listDecoys();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load decoys:", err);
      setError(err.message || "Failed to load canary decoy inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecoys();
  }, [loadDecoys]);

  const triggered = items.filter((d) =>
    ["compromised", "triggered", "accessed"].includes(d.status?.toLowerCase())
  );
  const active = items.filter((d) =>
    ["active", "healthy", "verified"].includes(d.status?.toLowerCase())
  );

  const filteredItems = items.filter((d) => {
    const s = d.status?.toLowerCase() || "";
    if (filter === "active") return ["active", "healthy", "verified"].includes(s);
    if (filter === "compromised") return ["compromised", "triggered", "accessed"].includes(s);
    return true;
  });

  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider flex items-center gap-2">
            <Ghost className="w-6 h-6 text-purple-500" /> Decoy Vaults
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Canary files, honey credentials, and deception sensors planted across cluster nodes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDecoys}
            className="p-2 bg-surface-container-low hover:bg-surface-container-high rounded-full transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Summary Metrics */}
      <div className="flex gap-4 mb-6">
        {[
          { label: "Total Decoys", value: items.length, color: "text-primary" },
          { label: "Active Canaries", value: active.length, color: "text-emerald-600" },
          { label: "Triggered Assets", value: triggered.length, color: "text-error" },
          {
            label: "Pending Verification",
            value: items.filter((d) => !d.last_verified).length,
            color: "text-amber-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex-1 bg-white rounded-2xl p-4 border border-outline-variant/10 shadow-sm"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Triggered Alert Banner */}
      {triggered.length > 0 && (
        <div className="flex items-center gap-3 bg-error/5 border border-error/20 rounded-xl px-4 py-3 mb-5">
          <ShieldAlert className="w-5 h-5 text-error shrink-0 animate-pulse" />
          <p className="text-xs text-error font-semibold flex-1">
            {triggered.length} canary decoy asset{triggered.length > 1 ? "s have" : " has"} recorded unauthorized access — immediate forensic investigation required.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-error bg-error-container/15 border border-error/15 rounded-lg px-3 py-2.5 mb-5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={loadDecoys} className="font-bold underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "active", "compromised"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
              filter === tab
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-8 space-y-3">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-outline-variant/10 shadow-sm">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-xs text-on-surface-variant">Querying decoy inventory across client schema...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 px-6 bg-white rounded-2xl border border-outline-variant/10 shadow-sm">
              <Ghost className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-on-surface mb-1">No Decoy Assets Found</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                No honeypot files matching this filter. Plant decoy paths on your server to trap malicious actors.
              </p>
            </div>
          ) : (
            filteredItems.map((d) => {
              const Icon = getDecoyTypeIcon(d.decoy_type);
              const isCompromised = ["compromised", "triggered", "accessed"].includes(
                d.status?.toLowerCase()
              );
              const isVerified = ["active", "healthy", "verified"].includes(
                d.status?.toLowerCase()
              );

              return (
                <div
                  key={d.id}
                  className={`bg-white rounded-2xl px-5 py-4 border shadow-sm flex items-center gap-4 transition-all hover:shadow-md group ${
                    isCompromised
                      ? "border-error/20 bg-error/[0.01]"
                      : "border-outline-variant/10"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isCompromised
                        ? "bg-error/10 text-error"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-mono font-semibold text-on-surface truncate">
                        {d.file_path}
                      </p>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 uppercase">
                        {d.decoy_type || "Canary"}
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant">
                      Node: <span className="font-mono font-bold text-primary">{d.server_id}</span> · Hash:{" "}
                      <span className="font-mono text-[9px]">{d.original_hash?.slice(0, 10)}...</span>
                    </p>
                  </div>
                  <div className="text-right min-w-[110px]">
                    {isCompromised ? (
                      <span className="text-[10px] font-bold text-error flex items-center justify-end gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> Triggered
                      </span>
                    ) : isVerified ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Active & Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-on-surface-variant">
                        {d.status || "Planted"}
                      </span>
                    )}
                    <p className="text-[9px] font-mono text-on-surface-variant/60 mt-0.5">
                      {d.planted_at ? new Date(d.planted_at).toLocaleDateString() : "Active"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Sidebar Info & Guidance */}
        <section className="col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" /> Deception Policy
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
              Canary traps are planted into realistic filesystem paths without legitimate business use. Any read or write access generates instant P1 alerts and initiates host telemetry isolation.
            </p>
            <div className="border-t border-outline-variant/10 pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Telemetry Ingestion</span>
                <span className="font-bold text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Crypto Hashes</span>
                <span className="font-mono text-[10px] text-on-surface">SHA-256</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tripwire Alerting</span>
                <span className="font-bold text-primary">Zero Tolerance</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
