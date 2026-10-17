"use client";

import { useState, useEffect } from "react";
import { Server, Grid, List, MoreVertical, RefreshCw, Loader2, Copy, Check } from "lucide-react";
import { nodeService } from "@/services/nodeService";
import { serverService } from "@/services/serverService";
import type { NodeInventory, ServerResponse } from "@/lib/types";

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

function formatCpu(cpu: number | null): string {
  if (cpu === null) return "N/A";
  if (typeof cpu === "number") {
    // Avoid ugly raw float precision like 6.464646464791375%
    return `${Number.isInteger(cpu) ? cpu : cpu.toFixed(1)}%`;
  }
  return `${cpu}%`;
}

export function ManagedInfrastructure() {
  const [nodes, setNodes] = useState<NodeInventory[]>([]);
  const [servers, setServers] = useState<ServerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyServerId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchNodes = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      nodeService.getNodes().catch(() => [] as NodeInventory[]),
      serverService.listServers().catch(() => [] as ServerResponse[]),
    ])
      .then(([nodesData, serversData]) => {
        setNodes(Array.isArray(nodesData) ? nodesData : []);
        setServers(Array.isArray(serversData) ? serversData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load infrastructure nodes:", err);
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

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1.5">
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

        {nodes.map((node) => {
          // Resolve hostname from server registry or node metadata
          const rawIp = (node.ip || "").split("/")[0].trim();
          const matchingServer = servers.find(
            (s) =>
              s.id === node.id ||
              (s.ip_address && rawIp && (s.ip_address === rawIp || s.ip_address === node.ip)) ||
              (s.hostname && node.id.toLowerCase().includes(s.hostname.toLowerCase()))
          );
          const hostname =
            node.hostname ||
            node.host_name ||
            node.host ||
            node.name ||
            node.server_hostname ||
            matchingServer?.hostname ||
            node.id;
          const serverId =
            node.server_id ||
            node.serverId ||
            matchingServer?.id ||
            node.id;

          return (
            <div
              key={node.id}
              className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10 flex items-center justify-between group hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <Server className="w-7 h-7 text-primary opacity-20" />
                  <div
                    className={`absolute bottom-0 right-0 w-2 h-2 ${statusColor(node.status)} rounded-full border-2 border-white`}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className="font-headline font-bold text-sm text-on-surface leading-tight">
                    {hostname}
                  </h4>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-primary flex-wrap">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/70 font-sans shrink-0">
                      Server ID:
                    </span>
                    <span className="font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded select-all break-all">
                      {serverId}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => copyServerId(serverId, e)}
                      className="p-0.5 hover:bg-surface-container-high rounded text-on-surface-variant/60 hover:text-primary transition-colors shrink-0"
                      title="Copy full Server ID"
                    >
                      {copiedId === serverId ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5">
                    <span>{node.location || "Cluster Node"}</span>
                    <span>•</span>
                    <span className="font-mono">{node.ip}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8 text-center">
                <div>
                  <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">
                    CPU
                  </p>
                  <p className={`text-xs font-bold ${cpuColor(node.cpu)} font-mono`}>
                    {formatCpu(node.cpu)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">
                    Memory
                  </p>
                  <p className="text-xs font-bold text-primary font-mono">
                    {node.memoryUsed !== null && node.memoryTotal !== null
                      ? `${node.memoryUsed} / ${node.memoryTotal} GB`
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
          );
        })}
      </div>
    </section>
  );
}
