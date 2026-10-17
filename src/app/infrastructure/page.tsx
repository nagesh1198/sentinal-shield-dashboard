"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AddDatabaseModal } from "@/components/AddDatabaseModal";
import { AddServerModal } from "@/components/AddServerModal";
import { LiveHeartbeatLog } from "@/components/LiveHeartbeatLog";
import { nodeService } from "@/services/nodeService";
import { serverService } from "@/services/serverService";
import type { NodeInventory, ServerResponse } from "@/lib/types";
import {
  Server, Cpu, MemoryStick, Activity, MoreVertical,
  RotateCcw, ShieldOff, Database, Plus, Eye, Key,
  RefreshCw, Loader2, AlertTriangle, ShieldCheck, Lock
} from "lucide-react";
import { usePermissions } from "@/lib/rbac";

const deceptionDbs = [
  {
    id: "DB-22910384", name: "PostgreSQL Main", type: "PostgreSQL",
    status: "5 Canaries Active", statusColor: "text-primary bg-primary/5",
    host: "db.prod.internal",
    detail: { label: "Monitored Schemas", value: "_system_config, user_secrets" },
    icon: Database, iconColor: "text-primary",
  },
  {
    id: "DB-88120399", name: "Redis Cache Cluster", type: "Redis",
    status: "Connected", statusColor: "text-emerald-700 bg-emerald-50",
    host: "redis-01.cache.svc",
    detail: { label: "Detection Mode", value: "Key Access Observability" },
    icon: Key, iconColor: "text-amber-600",
  },
];

const statusColor: Record<string, string> = {
  online: "bg-emerald-500",
  active: "bg-emerald-500",
  warning: "bg-amber-500",
  degraded: "bg-amber-500",
  offline: "bg-error",
  provisioning: "bg-blue-500",
};

const statusText: Record<string, string> = {
  online: "text-emerald-600 bg-emerald-50",
  active: "text-emerald-600 bg-emerald-50",
  warning: "text-amber-700 bg-amber-100",
  degraded: "text-amber-700 bg-amber-100",
  offline: "text-error bg-error-container",
  provisioning: "text-blue-600 bg-blue-50",
};

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-container-low rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="text-[10px] font-mono text-on-surface-variant w-7 text-right">{value}%</span>
    </div>
  );
}

export default function InfrastructurePage() {
  const { can, role, isReadOnly } = usePermissions();
  const canManageServer = can("server.manage");

  const [nodes, setNodes] = useState<NodeInventory[]>([]);
  const [servers, setServers] = useState<ServerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDb, setShowAddDb] = useState(false);
  const [showAddServer, setShowAddServer] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nodesData, serversData] = await Promise.all([
        nodeService.getNodes().catch(() => [] as NodeInventory[]),
        serverService.listServers().catch(() => [] as ServerResponse[]),
      ]);
      setNodes(Array.isArray(nodesData) ? nodesData : []);
      setServers(Array.isArray(serversData) ? serversData : []);
    } catch (err: any) {
      console.error("Infrastructure fetch error:", err);
      setError(err.message || "Failed to load infrastructure telemetry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onlineCount = nodes.filter((n) => ["online", "active", "healthy"].includes(n.status?.toLowerCase())).length;
  const warningCount = nodes.filter((n) => ["warning", "degraded"].includes(n.status?.toLowerCase())).length;
  const offlineCount = nodes.filter((n) => ["offline", "error", "critical"].includes(n.status?.toLowerCase())).length;

  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider">Infrastructure</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Real-time node health, servers, and resource telemetry</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {onlineCount} Online
            </span>
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> {warningCount} Warning
            </span>
            <span className="flex items-center gap-1.5 text-error">
              <span className="w-2 h-2 rounded-full bg-error inline-block" /> {offlineCount} Offline
            </span>
          </div>
          <button
            onClick={loadData}
            className="p-2 bg-surface-container-low hover:bg-surface-container-high rounded-full transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
          </button>
          {canManageServer ? (
            <button
              onClick={() => setShowAddServer(true)}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-primary-container transition-all shadow-md shadow-primary/20"
            >
              <Plus className="w-3.5 h-3.5" /> Add Server
            </button>
          ) : (
            <div
              title={`Role '${role}' cannot register servers (requires server.manage)`}
              className="flex items-center gap-1.5 bg-surface-container-high text-on-surface-variant/40 px-3.5 py-2 rounded-full text-xs font-semibold cursor-not-allowed border border-outline-variant/20"
            >
              <Lock className="w-3.5 h-3.5 text-on-surface-variant/40" /> Add Server
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 text-xs text-error bg-error-container/15 border border-error/15 rounded-lg px-3 py-2.5 mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={loadData} className="font-bold underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Node Cards */}
      {loading && nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-outline-variant/10 shadow-sm mb-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <p className="text-xs text-on-surface-variant font-medium">Querying cluster nodes & servers...</p>
        </div>
      ) : nodes.length === 0 ? (
        <div className="text-center py-12 px-6 bg-white rounded-2xl border border-outline-variant/10 shadow-sm mb-8">
          <Server className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-on-surface mb-1">No Active Infrastructure Nodes</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-4">
            Connect an agent using the installation command to begin live observability.
          </p>
          <button
            onClick={() => setShowAddServer(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-primary-container transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Provision First Server
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8 max-h-[720px] overflow-y-auto pr-1">
          {nodes.map((n) => {
            const statusKey = n.status?.toLowerCase() || "offline";
            const cpuVal = typeof n.cpu === "number" ? Math.round(n.cpu) : 0;
            const memVal =
              n.memoryTotal && n.memoryUsed
                ? Math.round((n.memoryUsed / n.memoryTotal) * 100)
                : typeof n.memoryUsed === "number"
                ? Math.round(n.memoryUsed)
                : 0;

            const matchingServer = servers.find(
              (s) =>
                s.id === n.id ||
                s.hostname?.toLowerCase() === n.id.toLowerCase() ||
                (s.ip_address && n.ip && s.ip_address === n.ip)
            );
            const hostname =
              n.hostname ||
              n.host_name ||
              n.host ||
              n.name ||
              n.server_hostname ||
              matchingServer?.hostname ||
              n.id;
            const serverId =
              n.server_id ||
              n.serverId ||
              matchingServer?.id ||
              n.id;

            return (
              <div key={n.id} className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Server className="w-8 h-8 text-primary opacity-20" />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColor[statusKey] || "bg-gray-400"}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface leading-tight">
                        {hostname}
                      </h3>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-primary mt-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/70 font-sans">
                          Server ID:
                        </span>
                        <span className="font-bold select-all break-all">
                          {serverId}
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 mt-1">
                        <span>{n.location || "Cluster Node"}</span>
                        <span>•</span>
                        <span className="font-mono">{n.ip}</span>
                        {n.memoryTotal !== null && n.memoryUsed !== null && (
                          <>
                            <span>•</span>
                            <span className="font-mono font-medium text-primary">
                              {n.memoryUsed}/{n.memoryTotal} GB RAM
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${statusText[statusKey] || "text-gray-600 bg-gray-50"}`}>
                      {n.status || "Unknown"}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-surface-container-low rounded-full">
                      <MoreVertical className="w-4 h-4 text-on-surface-variant" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2.5 mb-4">
                  <div>
                    <div className="flex justify-between text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">
                      <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> CPU</span>
                      <span className={cpuVal > 70 ? "text-error font-bold" : ""}>{cpuVal}%</span>
                    </div>
                    <Bar value={cpuVal} color={cpuVal > 70 ? "bg-error" : "bg-primary"} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">
                      <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3 text-primary" /> Memory</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        {n.memoryUsed !== null && n.memoryTotal !== null && (
                          <span className="text-[10px] text-on-surface font-semibold lowercase">
                            {n.memoryUsed} / {n.memoryTotal} GB
                          </span>
                        )}
                        <span className={`text-[10px] ${memVal > 80 ? "text-error font-bold" : "text-primary font-bold"}`}>
                          ({memVal}%)
                        </span>
                      </div>
                    </div>
                    <Bar value={memVal} color={memVal > 80 ? "bg-amber-500" : "bg-primary-container"} />
                    {n.memoryUsed !== null && n.memoryTotal !== null && (
                      <div className="flex justify-between items-center text-[9px] text-on-surface-variant/70 font-mono mt-1">
                        <span>Used: <strong className="text-on-surface">{n.memoryUsed} GB</strong></span>
                        <span>Total: <strong className="text-on-surface">{n.memoryTotal} GB</strong></span>
                        <span>Free: <strong className="text-emerald-600">{(Math.max(0, n.memoryTotal - n.memoryUsed)).toFixed(2)} GB</strong></span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Telemetry</span>
                      <span className="text-emerald-600 font-bold">Active</span>
                    </div>
                    <Bar value={100} color="bg-secondary-container" />
                  </div>
                </div>

                {/* Live Heartbeat Log */}
                {statusKey !== "offline" && (
                  <div className="mb-4">
                    <LiveHeartbeatLog nodeId={n.id} height="140px" intervalMs={1200} />
                  </div>
                )}
                <div className="pt-3 border-t border-outline-variant/10 flex justify-between items-center">
                  <div className="text-[10px]">
                    <span className="text-on-surface-variant">Observability: </span>
                    <span className="font-bold text-on-surface">Telemetry Linked</span>
                    {n.threats > 0 && <span className="ml-3 text-error font-bold">{n.threats} threat{n.threats > 1 ? "s" : ""}</span>}
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors">
                      <RotateCcw className="w-3 h-3" /> Restart
                    </button>
                    <button className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-error-container text-error hover:bg-error hover:text-white transition-colors">
                      <ShieldOff className="w-3 h-3" /> Isolate
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Registered Servers Table (Direct Server API) ── */}
      {servers.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-primary">Provisioned Servers</h2>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Direct backend server registry inventory.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-surface-container-low px-2.5 py-1 rounded-full">
              {servers.length} Registered
            </span>
          </div>
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b border-outline-variant/10 text-on-surface-variant uppercase text-[9px] tracking-wider">
                  <th className="py-2 font-bold">Hostname</th>
                  <th className="py-2 font-bold">IP Address</th>
                  <th className="py-2 font-bold">Project ID</th>
                  <th className="py-2 font-bold">Status</th>
                  <th className="py-2 font-bold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {servers.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-low/40">
                    <td className="py-2.5 font-bold text-primary flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-on-surface-variant" />
                      {s.hostname}
                    </td>
                    <td className="py-2.5 font-mono text-on-surface-variant">{s.ip_address}</td>
                    <td className="py-2.5 font-mono text-[10px] text-on-surface-variant truncate max-w-[120px]">{s.project_id}</td>
                    <td className="py-2.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${statusText[s.status.toLowerCase()] || "bg-gray-100 text-gray-700"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-on-surface-variant text-[10px]">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Global Heartbeat Feed ── */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-base font-bold text-primary">Global Node Event Feed</h2>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Real-time events across all nodes — handshakes, auth, traffic and deception checks.</p>
          </div>
        </div>
        <LiveHeartbeatLog height="260px" intervalMs={4000} maxEntries={60} />
      </div>

      {/* ── Deception Databases ── */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base font-bold text-primary">Deception Databases</h2>
          <p className="text-[10px] text-on-surface-variant mt-0.5">Configure canary schemas and monitored data entities.</p>
        </div>
        <button
          onClick={() => setShowAddDb(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-primary-container transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-3.5 h-3.5" /> Add Database
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {deceptionDbs.map((db) => (
          <div key={db.id} className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/5 rounded-xl flex items-center justify-center shrink-0">
                  <db.icon className={`w-4 h-4 ${db.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">{db.name}</p>
                  <p className="text-[9px] font-mono text-on-surface-variant">{db.id}</p>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${db.statusColor}`}>{db.status}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Host</span>
                <span className="font-mono text-on-surface">{db.host}</span>
              </div>
              <div className="flex justify-between items-start py-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest shrink-0">{db.detail.label}</span>
                <span className="font-mono text-on-surface text-right ml-4 text-[10px]">{db.detail.value}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-outline-variant/10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-colors font-bold">
                <Eye className="w-3 h-3" /> View Canaries
              </button>
              <button className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors font-bold">
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      <AddDatabaseModal isOpen={showAddDb} onClose={() => setShowAddDb(false)} />
      <AddServerModal isOpen={showAddServer} onClose={() => setShowAddServer(false)} onSuccess={loadData} />
    </DashboardLayout>
  );
}
