"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, Filter, Search, Clock, ChevronRight,
  TriangleAlert, Info, Loader2, Server, Ghost, ShieldCheck,
  ShieldAlert, FileCode, Copy, Check, ExternalLink, X,
  Terminal, Activity, MapPin, RefreshCw, Layers
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { serverService } from "@/services/serverService";
import { nodeService } from "@/services/nodeService";
import { decoyService } from "@/services/decoyService";
import type { AlertPayload, ServerResponse, NodeInventory, DecoyResponse } from "@/lib/types";

const badgeColor: Record<string, string> = {
  critical: "bg-error-container text-error border-error/20",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  info: "bg-primary/5 text-primary border-primary/20",
  high: "bg-error-container text-error border-error/20",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-primary/5 text-primary border-primary/20",
};

const severityDot = (severity: string) => {
  const s = severity.toLowerCase();
  if (s === "critical" || s === "high") return "bg-error";
  if (s === "medium" || s === "warning") return "bg-amber-500";
  if (s === "low" || s === "info") return "bg-emerald-500";
  return "bg-primary";
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

function timeAgo(isoString: string): string {
  try {
    const d = new Date(isoString);
    const secs = Math.floor((Date.now() - d.getTime()) / 1000);
    if (secs < 60) return "just now";
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return "";
  }
}

function getAlertDescription(alert: AlertPayload): string {
  if (alert.details && typeof alert.details.message === "string") {
    return alert.details.message;
  }
  if (alert.details && Object.keys(alert.details).length > 0) {
    const parts = Object.entries(alert.details)
      .filter(([k]) => !["pid", "process_id", "severity"].includes(k))
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`);
    if (parts.length > 0) return parts.join(" • ");
  }
  return `Security signal of type ${alert.event_type} registered on host ${alert.server_id}`;
}

export default function EventsPage() {
  const [events, setEvents] = useState<AlertPayload[]>([]);
  const [servers, setServers] = useState<ServerResponse[]>([]);
  const [nodes, setNodes] = useState<NodeInventory[]>([]);
  const [decoys, setDecoys] = useState<DecoyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<"All" | "Critical" | "Warning" | "Info">("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer / Inspection state
  const [selectedEvent, setSelectedEvent] = useState<AlertPayload | null>(null);
  const [selectedDecoy, setSelectedDecoy] = useState<DecoyResponse | null>(null);
  const [loadingDecoy, setLoadingDecoy] = useState(false);
  const [decoyError, setDecoyError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Load telemetry, servers, nodes, and decoys
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, serversRes, nodesRes, decoysRes] = await Promise.all([
        dashboardService.getAlerts(undefined, 100).catch(() => ({ data: [] })),
        serverService.listServers().catch(() => [] as ServerResponse[]),
        nodeService.getNodes().catch(() => [] as NodeInventory[]),
        decoyService.listDecoys().catch(() => [] as DecoyResponse[]),
      ]);

      setEvents(alertsRes.data || []);
      setServers(Array.isArray(serversRes) ? serversRes : []);
      setNodes(Array.isArray(nodesRes) ? nodesRes : []);
      setDecoys(Array.isArray(decoysRes) ? decoysRes : []);
    } catch (err) {
      console.error("Failed to load events telemetry:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Establish real-time SSE stream
    const es = dashboardService.getAlertStream();
    if (es) {
      es.onopen = () => setConnected(true);
      es.onmessage = (event) => {
        try {
          const alert: AlertPayload = JSON.parse(event.data);
          setEvents((prev) => [alert, ...prev].slice(0, 200));
        } catch {
          // ignore keep-alive pings
        }
      };
      es.onerror = () => {
        setConnected(false);
        es.close();
      };
      return () => es.close();
    }
  }, [loadInitialData]);

  // Resolves rich server info from serverId
  const getServerInfo = useCallback((serverId: string) => {
    const s = servers.find((srv) => srv.id === serverId || srv.hostname === serverId);
    if (s) {
      return {
        name: s.hostname || serverId,
        id: s.id,
        ip: s.ip_address || "—",
        status: s.status || "active",
        location: (s.specs?.location as string) || "Cloud Node",
      };
    }
    const n = nodes.find((node) => node.id === serverId);
    if (n) {
      return {
        name: n.id,
        id: n.id,
        ip: n.ip || "—",
        status: n.status || "active",
        location: n.location || "Cluster Node",
      };
    }
    return {
      name: serverId,
      id: serverId,
      ip: "10.0.1.0/24",
      status: "active",
      location: "Cluster Node",
    };
  }, [servers, nodes]);

  // Event click handler: fetches decoy via decoyService.getDecoy
  const handleSelectEvent = async (event: AlertPayload) => {
    setSelectedEvent(event);
    setLoadingDecoy(true);
    setSelectedDecoy(null);
    setDecoyError(null);

    // Identify candidate decoy ID from event details or matching decoy inventory
    const candidateId =
      (event.details?.decoy_id as string) ||
      (event.details?.decoyId as string) ||
      (event.details?.asset_id as string);

    let decoyToFetch = candidateId;

    if (!decoyToFetch) {
      const filePath = (event.details?.file_path || event.details?.path) as string;
      const matched = decoys.find(
        (d) =>
          (filePath && d.file_path && d.file_path.toLowerCase() === filePath.toLowerCase()) ||
          (d.server_id && d.server_id === event.server_id)
      );
      if (matched) {
        decoyToFetch = matched.id;
      }
    }

    if (decoyToFetch) {
      try {
        const decoy = await decoyService.getDecoy(decoyToFetch);
        setSelectedDecoy(decoy);
      } catch (err: any) {
        console.warn("getDecoy failed for ID:", decoyToFetch, err.message);
        const cached = decoys.find((d) => d.id === decoyToFetch);
        if (cached) {
          setSelectedDecoy(cached);
        } else {
          setDecoyError(err.message || "Failed to retrieve decoy record");
        }
      } finally {
        setLoadingDecoy(false);
      }
    } else {
      setLoadingDecoy(false);
    }
  };

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Counts calculations
  const totalCount = events.length;
  const criticalCount = events.filter(e => e.severity.toLowerCase() === "critical" || e.severity.toLowerCase() === "high").length;
  const warningCount = events.filter(e => e.severity.toLowerCase() === "warning" || e.severity.toLowerCase() === "medium").length;
  const infoCount = events.filter(e => e.severity.toLowerCase() === "info" || e.severity.toLowerCase() === "low").length;

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    if (filter !== "All") {
      const sev = e.severity.toLowerCase();
      const f = filter.toLowerCase();
      if (f === "critical" && sev !== "critical" && sev !== "high") return false;
      if (f === "warning" && sev !== "warning" && sev !== "medium") return false;
      if (f === "info" && sev !== "info" && sev !== "low") return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const type = e.event_type.toLowerCase();
      const desc = getAlertDescription(e).toLowerCase();
      const node = e.server_id.toLowerCase();
      const serverName = getServerInfo(e.server_id).name.toLowerCase();
      return type.includes(q) || desc.includes(q) || node.includes(q) || serverName.includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider">Live Event Stream</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Real-time prioritised telemetry and cyber-deception signals</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadInitialData}
            className="p-2 bg-surface-container-low hover:bg-surface-container-high rounded-full transition-colors text-primary"
            title="Refresh events"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="flex items-center gap-2 text-xs font-medium text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/15">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-error"} animate-pulse inline-block`} />
            {connected ? "Live Stream Active" : "Polling Mode"}
          </span>
        </div>
      </header>

      {/* Summary Strip */}
      <div className="flex gap-3 mb-6">
        {[
          { label: "Total Events", value: totalCount, icon: Clock, color: "text-primary" },
          { label: "Critical / High", value: criticalCount, icon: TriangleAlert, color: "text-error" },
          { label: "Warnings", value: warningCount, icon: AlertTriangle, color: "text-amber-600" },
          { label: "Informational", value: infoCount, icon: Info, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="flex-1 bg-white rounded-2xl p-4 border border-outline-variant/10 shadow-sm flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.color} opacity-80`} />
            <div>
              <p className="text-2xl font-bold text-on-surface">{s.value}</p>
              <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center bg-surface-container-high px-3.5 py-2 rounded-full flex-1 max-w-sm border border-outline-variant/15">
          <Search className="text-on-surface-variant/50 w-4 h-4 mr-2" />
          <input
            className="bg-transparent border-none outline-none text-xs w-full text-on-surface placeholder:text-on-surface-variant/40"
            placeholder="Search by event type, description, or server name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {(["All", "Critical", "Warning", "Info"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              filter === f
                ? "bg-primary text-white shadow-primary/20"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-on-surface-variant">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[11px] font-semibold">{filteredEvents.length} Signals</span>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2.5">
        {loading && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-outline-variant/10 shadow-sm">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-xs text-on-surface-variant font-medium">Ingesting live security events and server metadata...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-outline-variant/10 text-center shadow-sm">
            <Clock className="w-12 h-12 text-outline-variant mx-auto mb-4 opacity-50" />
            <h3 className="text-base font-bold text-on-surface">No Events Found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-2">
              {searchQuery || filter !== "All"
                ? "No events match the current filter or search criteria. Try modifying your filter options."
                : "There are no live security events registered on your tenant yet. Active agents will stream telemetry events here in real-time."}
            </p>
          </div>
        ) : (
          filteredEvents.map((e) => {
            const displaySeverity = e.severity.toLowerCase() as keyof typeof badgeColor;
            const badgeLabel = e.severity.toUpperCase();
            const serverInfo = getServerInfo(e.server_id);
            const pid = (e.details?.pid || e.details?.process_id) as string | undefined;
            const hasDecoyLink =
              Boolean(e.details?.decoy_id || e.details?.decoyId || e.details?.file_path) ||
              e.event_type.toLowerCase().includes("decoy") ||
              e.event_type.toLowerCase().includes("canary") ||
              decoys.some((d) => d.server_id === e.server_id);

            return (
              <div
                key={e.id}
                onClick={() => handleSelectEvent(e)}
                className={`bg-white rounded-xl p-4 border transition-all cursor-pointer group hover:shadow-md hover:border-primary/30 flex items-start gap-4 ${
                  selectedEvent?.id === e.id
                    ? "border-primary ring-1 ring-primary/20 bg-primary/[0.01]"
                    : "border-outline-variant/10"
                }`}
              >
                {/* Severity Status Indicator */}
                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${severityDot(e.severity)}`} />

                <div className="flex-1 min-w-0">
                  {/* Top Bar: Severity Badge + Event Type + Server Name Badge */}
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        badgeColor[displaySeverity] || "bg-primary/5 text-primary border-primary/20"
                      }`}
                    >
                      {badgeLabel}
                    </span>

                    <h3 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                      {e.event_type}
                    </h3>

                    {/* Server Name Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface-container-low border border-outline-variant/15 text-[11px] font-medium text-on-surface">
                      <Server className="w-3 h-3 text-primary" />
                      <span className="font-bold text-primary">{serverInfo.name}</span>
                      <span className="text-[10px] text-on-surface-variant/70 font-mono">({serverInfo.ip})</span>
                    </div>

                    {/* Canary / Decoy Badge if applicable */}
                    {hasDecoyLink && (
                      <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        <Ghost className="w-3 h-3 text-purple-600" />
                        Canary Trigger
                      </span>
                    )}
                  </div>

                  {/* Description / Message */}
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed" title={getAlertDescription(e)}>
                    {getAlertDescription(e)}
                  </p>

                  {/* Context Meta Pills */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-on-surface-variant/70 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary/60" />
                      {formatTime(e.detected_at)} {timeAgo(e.detected_at) && `(${timeAgo(e.detected_at)})`}
                    </span>
                    {pid && (
                      <span className="flex items-center gap-1 bg-surface-container-high px-1.5 py-0.5 rounded">
                        <Terminal className="w-2.5 h-2.5" /> PID: {pid}
                      </span>
                    )}
                    <span className="text-primary/70">ID: {e.id.slice(0, 8)}</span>
                  </div>
                </div>

                {/* Inspect Action Arrow */}
                <div className="flex items-center gap-1 text-xs text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-2">
                  <span>Inspect</span>
                  <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Slide-Over Event & Decoy Details Drawer ── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease]"
          onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}
        >
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-[slideInRight_0.25s_ease] border-l border-outline-variant/15">
            <div>
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-outline-variant/10 mb-5">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${severityDot(selectedEvent.severity)}`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          badgeColor[selectedEvent.severity.toLowerCase()] || "bg-primary/5 text-primary border-primary/20"
                        }`}
                      >
                        {selectedEvent.severity.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant">
                        {formatTime(selectedEvent.detected_at)} ({timeAgo(selectedEvent.detected_at)})
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-on-surface">
                      {selectedEvent.event_type}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Server Information Section */}
              {(() => {
                const sInfo = getServerInfo(selectedEvent.server_id);
                return (
                  <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/15 shadow-sm mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Server className="w-4 h-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                        Host Server Context
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-medium text-on-surface-variant uppercase">Server Hostname</p>
                        <p className="font-bold text-on-surface font-mono">{sInfo.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-on-surface-variant uppercase">IP Address</p>
                        <p className="font-bold text-on-surface font-mono">{sInfo.ip}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-on-surface-variant uppercase">Server ID</p>
                        <p className="text-on-surface font-mono text-[11px] truncate">{sInfo.id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-on-surface-variant uppercase">Infrastructure Status</p>
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {sInfo.status.toUpperCase()} ({sInfo.location})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Linked Decoy Asset Section (Fetched via decoyService.getDecoy) */}
              <div className="bg-gradient-to-br from-purple-50/50 to-white rounded-xl p-4 border border-purple-200/60 shadow-sm mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Ghost className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-purple-900">
                      Canary Decoy Details
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded">
                    decoyService.getDecoy()
                  </span>
                </div>

                {loadingDecoy ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-purple-700 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span>Querying Canary registry via getDecoy...</span>
                  </div>
                ) : selectedDecoy ? (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-purple-100 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Asset File Path</p>
                          <p className="font-mono text-xs font-bold text-on-surface break-all">{selectedDecoy.file_path}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                          {selectedDecoy.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-purple-50">
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-medium">Decoy Type</p>
                          <p className="font-semibold text-on-surface">{selectedDecoy.decoy_type}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-medium">Planted Timestamp</p>
                          <p className="font-mono text-[11px] text-on-surface">{new Date(selectedDecoy.planted_at).toLocaleString()}</p>
                        </div>
                      </div>

                      {selectedDecoy.original_hash && (
                        <div className="pt-2 border-t border-purple-50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase">SHA256 Fingerprint</span>
                            <button
                              onClick={() => copyToClipboard(selectedDecoy.original_hash, setCopiedHash)}
                              className="text-[10px] font-bold text-purple-700 flex items-center gap-1 hover:underline"
                            >
                              {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              {copiedHash ? "Copied" : "Copy Hash"}
                            </button>
                          </div>
                          <p className="font-mono text-[10px] text-on-surface bg-surface-container-low p-2 rounded break-all border border-outline-variant/10">
                            {selectedDecoy.original_hash}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/80 p-4 rounded-lg border border-dashed border-purple-200 text-center">
                    <ShieldCheck className="w-6 h-6 text-purple-400 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-on-surface">No Canary Trap Attached</p>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                      This signal was generated by system telemetry, traffic pattern analysis, or network observability rather than a decoy file trigger.
                    </p>
                  </div>
                )}
              </div>

              {/* Event Description & Context */}
              <div className="bg-white rounded-xl p-4 border border-outline-variant/10 shadow-sm mb-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  Signal Description
                </h3>
                <p className="text-xs text-on-surface leading-relaxed">
                  {getAlertDescription(selectedEvent)}
                </p>
              </div>

              {/* Raw Event Payload & Details */}
              <div className="bg-[#0e1117] rounded-xl p-4 border border-outline-variant/20 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Raw Event Payload
                  </span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(selectedEvent, null, 2), setCopiedJson)}
                    className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedJson ? "Copied JSON" : "Copy Payload"}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap break-all overflow-x-auto max-h-52 select-all leading-5">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            {/* Footer Quick Actions */}
            <div className="pt-4 border-t border-outline-variant/10 mt-6 flex justify-between items-center">
              <span className="text-[10px] font-mono text-on-surface-variant">Event ID: {selectedEvent.id}</span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-container transition-colors shadow-md shadow-primary/20"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
