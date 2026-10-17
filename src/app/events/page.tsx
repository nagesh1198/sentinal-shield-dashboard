"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import {
  AlertTriangle, Filter, Search, Clock, ChevronRight,
  TriangleAlert, Info, Loader2
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import type { AlertPayload } from "@/lib/types";

const badgeColor: Record<string, string> = {
  critical: "bg-error-container text-error",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-primary/5 text-primary",
  high: "bg-error-container text-error",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-primary/5 text-primary",
};

const severityDot = (severity: string) => {
  const s = severity.toLowerCase();
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

function getAlertDescription(alert: AlertPayload): string {
  if (alert.details && typeof alert.details.message === "string") {
    return alert.details.message;
  }
  if (alert.details && Object.keys(alert.details).length > 0) {
    return Object.entries(alert.details)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" • ");
  }
  return `Security signal of type ${alert.event_type} registered on host ${alert.server_id}`;
}

export default function EventsPage() {
  const [events, setEvents] = useState<AlertPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<"All" | "Critical" | "Warning" | "Info">("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Load historical events
    dashboardService
      .getAlerts(undefined, 100)
      .then((res) => {
        setEvents(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load events:", err);
        setLoading(false);
      });

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
  }, []);

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
      return type.includes(q) || desc.includes(q) || node.includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider">Live Event Stream</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Real-time prioritised system signals</p>
        </div>
        <span className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-error"} animate-pulse inline-block`} />
          {connected ? "Live Feed Active" : "Polling Feed Active"}
        </span>
      </header>

      {/* Summary Strip */}
      <div className="flex gap-3 mb-6">
        {[
          { label: "Total Loaded", value: totalCount, icon: Clock, color: "text-primary" },
          { label: "Critical", value: criticalCount, icon: TriangleAlert, color: "text-error" },
          { label: "Warnings", value: warningCount, icon: AlertTriangle, color: "text-amber-600" },
          { label: "Info", value: infoCount, icon: Info, color: "text-emerald-600" },
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
        <div className="flex items-center bg-surface-container-high px-3 py-1.5 rounded-full flex-1 max-w-xs">
          <Search className="text-outline w-4 h-4 mr-2" />
          <input
            className="bg-transparent border-none outline-none text-sm w-full text-on-surface"
            placeholder="Filter events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {(["All", "Critical", "Warning", "Info"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {f}
          </button>
        ))}
        <button className="ml-auto flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
          <Filter className="w-4 h-4" /> Advanced Filter
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-outline-variant/10">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-xs text-on-surface-variant">Ingesting telemetry data...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-outline-variant/10 text-center">
            <Clock className="w-12 h-12 text-outline-variant mx-auto mb-4 opacity-60" />
            <h3 className="text-base font-bold text-on-surface">No events found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-2">
              {searchQuery || filter !== "All"
                ? "No events match the current filter or search criteria. Try modifying your filter options."
                : "There are no live security events registered on your tenant yet. Active agents will stream telemetry events here in real-time."}
            </p>
          </div>
        ) : (
          filteredEvents.map((e) => {
            const displaySeverity = e.severity.toLowerCase() as keyof typeof badgeColor;
            const badgeLabel = e.severity.charAt(0).toUpperCase() + e.severity.slice(1).toLowerCase();
            const pid = (e.details?.pid || e.details?.process_id || "SYS") as string;
            return (
              <div
                key={e.id}
                className="bg-white rounded-xl p-4 border border-outline-variant/10 flex items-start gap-4 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${severityDot(e.severity)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        badgeColor[displaySeverity] || "bg-primary/5 text-primary"
                      }`}
                    >
                      {badgeLabel}
                    </span>
                    <p className="text-sm font-semibold text-on-surface">{e.event_type}</p>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate" title={getAlertDescription(e)}>
                    {getAlertDescription(e)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-on-surface-variant font-mono">{formatTime(e.detected_at)}</p>
                  <p className="text-[9px] text-primary/50 font-mono">
                    {e.server_id} | PID: {pid}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-outline opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
