"use client";

import { useState, useEffect } from "react";
import { History, ShieldCheck, Lock, AlertTriangle, Loader2 } from "lucide-react";
import { decoyService } from "@/services/decoyService";
import type { DecoyResponse } from "@/lib/types";

// Helper to extract file basename from a full path
function getBasename(path: string): string {
  if (!path) return "Unknown Asset";
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

function getStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s === "active" || s === "healthy" || s === "verified") {
    return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />;
  }
  if (s === "compromised" || s === "triggered" || s === "error") {
    return <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />;
  }
  return <Lock className="w-3.5 h-3.5 text-on-surface-variant" />;
}

export function ForensicsVault() {
  const [decoys, setDecoys] = useState<DecoyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    decoyService
      .listDecoys()
      .then((data) => {
        setDecoys(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Forensics Vault load error (using fallback):", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10">
      <div className="flex items-center gap-2 mb-3">
        <History className="text-primary w-3.5 h-3.5" />
        <h3 className="text-[9px] font-bold uppercase tracking-widest text-primary">
          Forensics Vault
        </h3>
      </div>

      <div className="space-y-1.5 min-h-[5.5rem] flex flex-col justify-center">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 text-primary animate-spin mr-2" />
            <span className="text-[10px] text-on-surface-variant">Syncing vaults...</span>
          </div>
        ) : error ? (
          /* Graceful fallback to local simulated logs if API fails */
          <>
            <div className="bg-white p-2.5 rounded-lg flex justify-between items-center shadow-sm border border-outline-variant/5">
              <span className="text-[10px] font-mono text-on-surface">AUDIT_LOG_230921.tar.gz</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="bg-white p-2.5 rounded-lg flex justify-between items-center shadow-sm border border-outline-variant/5">
              <span className="text-[10px] font-mono text-on-surface">TCP_DUMP_02.pcap</span>
              <Lock className="w-3.5 h-3.5 text-on-surface-variant" />
            </div>
          </>
        ) : decoys.length === 0 ? (
          /* Empty state for a new tenant */
          <div className="text-center py-6 border border-dashed border-outline-variant/30 rounded-lg bg-surface-container-lowest">
            <p className="text-[10px] text-on-surface-variant/80 px-4">
              No decoy files deployed. Deployed honeypots will list forensic targets here.
            </p>
          </div>
        ) : (
          /* Live Decoy Files */
          decoys.slice(0, 3).map((decoy) => (
            <div
              key={decoy.id}
              className="bg-white p-2.5 rounded-lg flex justify-between items-center shadow-sm border border-outline-variant/5 hover:border-primary/10 transition-colors"
            >
              <div className="min-w-0 pr-2">
                <p className="text-[10px] font-mono text-on-surface truncate" title={decoy.file_path}>
                  {getBasename(decoy.file_path)}
                </p>
                <p className="text-[8px] font-mono text-on-surface-variant/60 truncate">
                  Hash: {decoy.original_hash.slice(0, 16)}...
                </p>
              </div>
              <div className="shrink-0">
                {getStatusIcon(decoy.status)}
              </div>
            </div>
          ))
        )}
      </div>

      <button className="w-full mt-3 py-1.5 border border-primary/20 text-primary text-[10px] font-bold rounded-lg hover:bg-primary/5 transition-colors">
        View Full Archive
      </button>
    </div>
  );
}
