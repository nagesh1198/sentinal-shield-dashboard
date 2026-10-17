"use client";

import { useState, useEffect } from "react";
import { Server, Grid, List, MoreVertical, RefreshCw, Loader2 } from "lucide-react";
import { nodeService } from "@/services/nodeService";
import type { NodeInventory } from "@/lib/types";

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === "online" || s === "active" || s === "healthy") return "bg-emerald-500";
  if (s === "warning" || s === "degraded") return "bg-amber-500";
  if (s === "offline" || s === "error" || s === "critical") return "bg-red-500";
  return "bg-gray-400";
}

function cpuColor(cpu: number | null) {
  if (cpu === null) return "text-on-surface-variant";
  if (cpu > 80) return "text-error";
  if (cpu > 50) return "text-amber-600";
  return "text-primary";
}

export function ManagedInfrastructure() {
  const [nodes, setNodes] = useState<NodeInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNodes = () => {
    setLoading(true);
    setError(null);
    nodeService
      .getNodes()
      .then((data) => {
        setNodes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load nodes:", err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-headline font-bold text-primary">
          Managed Infrastructure
        </h2>
        <div className="flex gap-1.5 items-center">
          <button
            onClick={fetchNodes}
            className="p-1.5 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors"
            title="Refresh nodes"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="p-1.5 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors">
            <Grid className="w-3.5 h-3.5 text-on-surface" />
          </button>
          <button className="p-1.5 bg-primary text-white rounded-lg">
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-error bg-error-container/15 border border-error/15 rounded-lg px-3 py-2">
          Failed to load nodes: {error}
        </div>
      )}

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1.5">
        {loading && nodes.length === 0 && (
          <div className="flex items-center justify-center py-8 text-on-surface-variant">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading infrastructure nodes...</span>
          </div>
        )}

        {!loading && nodes.length === 0 && !error && (
          <div className="text-center py-8 text-on-surface-variant text-sm">
            No nodes registered yet. Use &quot;Add New Server&quot; to onboard your first node.
          </div>
        )}

        {nodes.map((node) => (
          <div
            key={node.id}
            className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10 flex items-center justify-between group hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <Server className="w-7 h-7 text-primary opacity-20" />
                <div
                  className={`absolute bottom-0 right-0 w-2 h-2 ${statusColor(node.status)} rounded-full border-2 border-white`}
                />
              </div>
              <div>
                <h4 className="font-headline font-semibold text-sm text-on-surface">
                  {node.id}
                </h4>
                <p className="text-[10px] text-on-surface-variant">
                  {node.location} | {node.ip}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-center">
              <div>
                <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">
                  CPU
                </p>
                <p className={`text-xs font-bold ${cpuColor(node.cpu)}`}>
                  {node.cpu !== null ? `${node.cpu}%` : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">
                  Memory
                </p>
                <p className="text-xs font-bold text-primary">
                  {node.memoryUsed !== null && node.memoryTotal !== null
                    ? `${node.memoryUsed} / ${node.memoryTotal}GB`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">
                  Threats
                </p>
                <p
                  className={`text-xs font-bold ${node.threats > 0 ? "text-error" : "text-on-surface"}`}
                >
                  {node.threats > 0 ? `${node.threats} Pending` : "0 Detected"}
                </p>
              </div>
            </div>
            <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-primary/5 rounded-full">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
