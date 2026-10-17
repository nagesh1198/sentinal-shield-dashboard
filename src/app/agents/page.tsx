"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { agentService } from "@/services/agentService";
import { serverService } from "@/services/serverService";
import { usePermissions } from "@/lib/rbac";
import type { AgentResponse, AgentRegistryResponse, ServerResponse } from "@/lib/types";
import {
  Bot,
  RefreshCw,
  Loader2,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Columns3,
  Eye,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Server,
  Lock,
  X,
  FileSpreadsheet,
  FileCode,
  Radio,
  ShieldCheck,
  Shield,
  Terminal,
} from "lucide-react";

// ─── Types & Extended Models ──────────────────────────────────────────────────

export interface EnrichedAgent extends AgentResponse {
  capabilities_proof?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  server_hostname?: string;
  server_ip?: string;
  server_specs?: Record<string, unknown>;
}

export type TableDensity = "compact" | "comfortable" | "detailed";

export type ColumnKey =
  | "id"
  | "server"
  | "status"
  | "version"
  | "capabilities"
  | "lastConnected"
  | "createdAt"
  | "actions";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  description: string;
  canHide: boolean;
}

const AVAILABLE_COLUMNS: ColumnDef[] = [
  { key: "id", label: "Agent ID", description: "Cryptographic agent UUID", canHide: false },
  { key: "server", label: "Bound Host / Server", description: "Target machine hostname and IP address", canHide: true },
  { key: "status", label: "Fleet Status", description: "Operational heartbeat and service state", canHide: false },
  { key: "version", label: "Agent Version", description: "Installed release binary and Git commit SHA", canHide: true },
  { key: "capabilities", label: "Capabilities & Proof", description: "Deception probes and cryptographic verification", canHide: true },
  { key: "lastConnected", label: "Last Heartbeat", description: "Most recent telemetry pulse from agent", canHide: true },
  { key: "createdAt", label: "Enrolled Date", description: "Initial onboarding timestamp into sentinel fleet", canHide: true },
  { key: "actions", label: "Actions", description: "Administrative controls and deep inspection", canHide: false },
];

const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = [
  "id",
  "server",
  "status",
  "version",
  "capabilities",
  "lastConnected",
  "actions",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "active" || s === "online" || s === "healthy") {
    return {
      label: "Active",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotCls: "bg-emerald-500",
      icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />,
    };
  }
  if (s === "decommissioned" || s === "offline" || s === "revoked") {
    return {
      label: "Decommissioned",
      cls: "bg-red-50 text-red-700 border-red-200",
      dotCls: "bg-red-500",
      icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
    };
  }
  if (s === "warning" || s === "degraded") {
    return {
      label: "Degraded",
      cls: "bg-amber-50 text-amber-800 border-amber-200",
      dotCls: "bg-amber-500",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
    };
  }
  return {
    label: status,
    cls: "bg-gray-100 text-gray-700 border-gray-200",
    dotCls: "bg-gray-400",
    icon: <Clock className="w-3.5 h-3.5 text-gray-500" />,
  };
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Never";
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    if (diffMs < 0) return "Just now";
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "Unknown";
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { can } = usePermissions();
  const canManageServer = can("server.manage") || can("security.respond");

  // Dynamic Fleet State (strictly derived from live backend APIs)
  const [agents, setAgents] = useState<EnrichedAgent[]>([]);
  const [servers, setServers] = useState<ServerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Table Adjustability & Customization States
  const [density, setDensity] = useState<TableDensity>("detailed");
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_VISIBLE_COLUMNS);
  const [isWideScrollable, setIsWideScrollable] = useState(true);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Search, Filter, Sort & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<ColumnKey>("status");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Detail View & Inspector Modals
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [inspectModalAgent, setInspectModalAgent] = useState<EnrichedAgent | null>(null);
  const [detailTab, setDetailTab] = useState<"proofs" | "server" | "actions">("proofs");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Fetch Agents & Merge with Server Metadata Dynamically ──
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [directRegRes, dashboardRes, serversRes] = await Promise.all([
        agentService.listAgents().catch(() => [] as AgentRegistryResponse[]),
        agentService.getAgents().catch(() => [] as AgentResponse[]),
        serverService.listServers().catch(() => [] as ServerResponse[]),
      ]);

      const directAgents = Array.isArray(directRegRes) ? directRegRes : [];
      const dashAgents = Array.isArray(dashboardRes) ? dashboardRes : [];
      const serverList = Array.isArray(serversRes) ? serversRes : [];
      setServers(serverList);

      const serverMap = new Map<string, ServerResponse>();
      serverList.forEach((s) => {
        if (s.id) serverMap.set(s.id, s);
      });

      // Merge registry agents with dashboard agents
      const agentMap = new Map<string, EnrichedAgent>();

      directAgents.forEach((a) => {
        const s = serverMap.get(a.server_id);
        agentMap.set(a.id, {
          ...a,
          server_hostname: s?.hostname || a.server_id,
          server_ip: s?.ip_address,
          server_specs: s?.specs,
        });
      });

      dashAgents.forEach((a) => {
        if (!agentMap.has(a.id)) {
          const s = serverMap.get(a.server_id);
          agentMap.set(a.id, {
            ...a,
            server_hostname: s?.hostname || a.server_id,
            server_ip: s?.ip_address,
            server_specs: s?.specs,
          });
        }
      });

      setAgents(Array.from(agentMap.values()));
    } catch (err: any) {
      console.error("Failed fetching live agents:", err);
      setError(err?.message || "Failed to load live agent fleet telemetry.");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Optional auto-refresh timer (30s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAgents();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAgents]);

  // ── Column Visibility Toggling ──
  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const resetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
  };

  // ── Decommission & Recommission Handlers ──
  const handleDecommission = async (agentId: string) => {
    if (!canManageServer) {
      alert("Unauthorized: Permission 'server.manage' required to decommission agents.");
      return;
    }
    setActionLoading(agentId);
    try {
      await agentService.decommission(agentId);
      await fetchAgents();
    } catch (err: any) {
      alert(`Decommission failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecommission = async (agentId: string) => {
    if (!canManageServer) {
      alert("Unauthorized: Permission 'server.manage' required to recommission agents.");
      return;
    }
    setActionLoading(agentId);
    try {
      await agentService.recommission(agentId);
      await fetchAgents();
    } catch (err: any) {
      alert(`Recommission failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Sorting & Filtering Logic ──
  const handleSort = (field: ColumnKey) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Status filter
      if (statusFilter !== "ALL") {
        const s = agent.status.toLowerCase();
        if (statusFilter === "ACTIVE" && !["active", "online", "healthy"].includes(s)) return false;
        if (statusFilter === "WARNING" && !["warning", "degraded"].includes(s)) return false;
        if (statusFilter === "OFFLINE" && !["decommissioned", "offline", "revoked"].includes(s)) return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = agent.id.toLowerCase().includes(q);
        const matchesServer =
          agent.server_id.toLowerCase().includes(q) ||
          (agent.server_hostname && agent.server_hostname.toLowerCase().includes(q)) ||
          (agent.server_ip && agent.server_ip.toLowerCase().includes(q));
        const matchesVersion = (agent.version || "").toLowerCase().includes(q);
        const matchesCommit = (agent.git_commit || "").toLowerCase().includes(q);
        const matchesProbes =
          agent.capabilities_proof &&
          JSON.stringify(agent.capabilities_proof).toLowerCase().includes(q);

        return matchesId || matchesServer || matchesVersion || matchesCommit || matchesProbes;
      }

      return true;
    });
  }, [agents, statusFilter, searchQuery]);

  const sortedAgents = useMemo(() => {
    return [...filteredAgents].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "id":
          comparison = a.id.localeCompare(b.id);
          break;
        case "server":
          comparison = (a.server_hostname || a.server_id).localeCompare(
            b.server_hostname || b.server_id
          );
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "version":
          comparison = (a.version || "").localeCompare(b.version || "");
          break;
        case "lastConnected":
          comparison =
            new Date(a.last_connected_at || 0).getTime() -
            new Date(b.last_connected_at || 0).getTime();
          break;
        case "createdAt":
          comparison =
            new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredAgents, sortField, sortDirection]);

  // ── Pagination Calculation ──
  const totalPages = Math.max(1, Math.ceil(sortedAgents.length / pageSize));
  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAgents.slice(start, start + pageSize);
  }, [sortedAgents, currentPage, pageSize]);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  // ── Dynamic Fleet KPI Counts ──
  const totalCount = agents.length;
  const activeCount = agents.filter((a) =>
    ["active", "online", "healthy"].includes(a.status.toLowerCase())
  ).length;
  const warningCount = agents.filter((a) =>
    ["warning", "degraded"].includes(a.status.toLowerCase())
  ).length;
  const offlineCount = agents.filter((a) =>
    ["decommissioned", "offline", "revoked"].includes(a.status.toLowerCase())
  ).length;
  const verifiedCount = agents.filter(
    (a) => a.capabilities_proof && (a.capabilities_proof as any).verified !== false
  ).length;

  // ── Data Export Handlers ──
  const exportToCSV = () => {
    const headers = [
      "Agent ID",
      "Server Hostname",
      "Server ID",
      "Server IP",
      "Status",
      "Version",
      "Git Commit",
      "Last Connected",
      "Enrolled Date",
    ];
    const rows = sortedAgents.map((a) => [
      `"${a.id}"`,
      `"${a.server_hostname || a.server_id}"`,
      `"${a.server_id}"`,
      `"${a.server_ip || ""}"`,
      `"${a.status}"`,
      `"${a.version || ""}"`,
      `"${a.git_commit || ""}"`,
      `"${a.last_connected_at || ""}"`,
      `"${a.created_at || ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sentinel-agent-fleet-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(sortedAgents, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sentinel-agent-fleet-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Density Style Rules ──
  const densityStyles = {
    compact: {
      table: "text-xs",
      header: "py-2 px-3 text-[9px]",
      cell: "py-2 px-3",
      chip: "text-[9px] py-0.5 px-1.5",
    },
    comfortable: {
      table: "text-sm",
      header: "py-3 px-4 text-[10px]",
      cell: "py-3 px-4",
      chip: "text-[10px] py-1 px-2.5",
    },
    detailed: {
      table: "text-sm",
      header: "py-3.5 px-4 text-[10px]",
      cell: "py-3.5 px-4",
      chip: "text-[10px] py-1 px-2.5 font-medium",
    },
  }[density];

  return (
    <DashboardLayout>
      {/* ── Page Header ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary -tracking-wider">Agents</h1>
            <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Bot className="w-3 h-3" /> Fleet Management
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Sentinel agent fleet management & monitoring
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              autoRefresh
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm"
                : "bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high"
            }`}
            title="Auto-refresh fleet telemetry every 30 seconds"
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse text-emerald-600" : ""}`} />
            Auto-Sync {autoRefresh ? "ON" : "OFF"}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="bg-surface-container-high text-primary px-4 py-2 rounded-xl text-xs font-semibold hover:bg-surface-container-highest transition-colors flex items-center gap-1.5 shadow-sm border border-outline-variant/15 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="bg-primary text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-md shadow-primary/20">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-xl py-1.5 hidden group-hover:block z-30 animate-[fadeIn_0.15s_ease-out]">
              <button
                onClick={exportToCSV}
                className="w-full text-left px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export as CSV
              </button>
              <button
                onClick={exportToJSON}
                className="w-full text-left px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-600" /> Export as JSON
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Fleet KPI Summary Cards (Dynamic) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-4 shadow-sm hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Total Fleet</span>
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-primary tracking-tight">{totalCount}</div>
          <div className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
            <Server className="w-3 h-3" /> Bound to {servers.length} servers
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-4 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Active & Online</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">{activeCount}</div>
          <div className="text-[10px] text-emerald-700/80 mt-1 font-medium">
            {totalCount ? Math.round((activeCount / totalCount) * 100) : 0}% fleet active
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-4 shadow-sm hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Degraded</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">{warningCount}</div>
          <div className="text-[10px] text-amber-700/80 mt-1 font-medium">Warning state</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-4 shadow-sm hover:border-red-500/30 transition-all">
          <div className="flex items-center justify-between text-red-700 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Decommissioned</span>
            <PowerOff className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 tracking-tight">{offlineCount}</div>
          <div className="text-[10px] text-red-700/80 mt-1 font-medium">Offline or decommissioned</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-4 shadow-sm hover:border-primary/30 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-primary text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Cryptographic Proofs</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-primary tracking-tight">{verifiedCount}</div>
          <div className="text-[10px] text-on-surface-variant mt-1 font-medium">
            Registry proofs registered
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center justify-between text-xs text-error bg-error-container/20 border border-error/20 rounded-xl p-3.5 mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAgents}
            className="text-[10px] font-bold uppercase underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table Customization Toolbar (Adjustable Controls) ── */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-4 mb-4 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-on-surface-variant/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Agent ID, Hostname, IP, Version, or Commit..."
              className="w-full pl-9 pr-8 py-2 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl text-xs overflow-x-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                statusFilter === "ALL"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-emerald-700 hover:bg-emerald-50/50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("WARNING")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "WARNING"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-amber-700 hover:bg-amber-50/50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
              Degraded ({warningCount})
            </button>
            <button
              onClick={() => setStatusFilter("OFFLINE")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "OFFLINE"
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-red-700 hover:bg-red-50/50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-300" />
              Decommissioned ({offlineCount})
            </button>
          </div>
        </div>

        {/* Second Row of Adjustments: Density, Column Picker, Width Mode, Row Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/10 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Table Density Controller */}
            <div className="flex items-center gap-1.5">
              <span className="text-on-surface-variant/70 font-medium text-[11px] uppercase tracking-wider">
                Density:
              </span>
              <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-outline-variant/15">
                {(["compact", "comfortable", "detailed"] as TableDensity[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDensity(d)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all ${
                      density === d
                        ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Visibility Selector Modal/Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowColumnPicker(!showColumnPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container-high text-on-surface rounded-lg border border-outline-variant/20 font-semibold transition-all"
              >
                <Columns3 className="w-3.5 h-3.5 text-primary" />
                Columns ({visibleColumns.length}/{AVAILABLE_COLUMNS.length})
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showColumnPicker && (
                <div className="absolute left-0 mt-1.5 w-64 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-2xl p-3 z-40 animate-[fadeIn_0.15s_ease-out]">
                  <div className="flex justify-between items-center pb-2 mb-2 border-b border-outline-variant/10">
                    <span className="font-bold text-xs text-on-surface">Customize Columns</span>
                    <button
                      onClick={resetColumns}
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      Reset Default
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {AVAILABLE_COLUMNS.map((col) => (
                      <label
                        key={col.key}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-surface-container-low cursor-pointer transition-colors ${
                          !col.canHide ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(col.key)}
                          disabled={!col.canHide}
                          onChange={() => toggleColumn(col.key)}
                          className="rounded text-primary focus:ring-primary/20"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-on-surface">{col.label}</div>
                          <div className="text-[9px] text-on-surface-variant/70 leading-none">
                            {col.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="pt-2 mt-2 border-t border-outline-variant/10 text-right">
                    <button
                      onClick={() => setShowColumnPicker(false)}
                      className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-container"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Layout Width Mode Toggle */}
            <button
              onClick={() => setIsWideScrollable(!isWideScrollable)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                isWideScrollable
                  ? "bg-primary/5 text-primary border-primary/20"
                  : "bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high"
              }`}
              title="Toggle between wide horizontal scroll and fit-to-screen"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {isWideScrollable ? "Wide Detailed Mode" : "Fit Screen Mode"}
            </button>
          </div>

          {/* Results Count & Current Filter Info */}
          <div className="text-[11px] text-on-surface-variant flex items-center gap-2">
            <span>
              Showing <strong className="text-on-surface">{sortedAgents.length}</strong> of {totalCount} agents
            </span>
            {(searchQuery || statusFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="text-primary hover:underline font-semibold text-[10px]"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Agents Data Table ── */}
      {loading && agents.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-16 text-center shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-semibold text-on-surface">Connecting to Sentinel Fleet...</p>
          <p className="text-xs text-on-surface-variant mt-1">Retrieving agent telemetry and proofs</p>
        </div>
      ) : sortedAgents.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-16 text-center shadow-sm">
          <Bot className="w-12 h-12 text-primary/30 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-on-surface">No Agents Found</h3>
          <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "No fleet agents matched your search query or status filter. Try clearing filters."
              : "No agents registered yet. Agents will appear here once servers are onboarded."}
          </p>
          {(searchQuery || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="mt-4 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm">
          <div className={`${isWideScrollable ? "overflow-x-auto" : "overflow-hidden"}`}>
            <table className={`w-full ${densityStyles.table} text-left border-collapse`}>
              {/* Table Header */}
              <thead>
                <tr className="border-b border-outline-variant/15 bg-surface-container-low select-none">
                  {/* Expand Chevron Column */}
                  <th className="w-8 py-3 px-3 text-center text-on-surface-variant/40">#</th>

                  {/* Agent ID Column */}
                  {visibleColumns.includes("id") && (
                    <th
                      onClick={() => handleSort("id")}
                      className={`${densityStyles.header} font-bold text-on-surface-variant/70 uppercase tracking-widest cursor-pointer hover:bg-surface-container-high/60 transition-colors`}
                      style={{ minWidth: "180px" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Agent ID</span>
                        {sortField === "id" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-primary" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </div>
                    </th>
                  )}

                  {/* Bound Server Column */}
                  {visibleColumns.includes("server") && (
                    <th
                      onClick={() => handleSort("server")}
                      className={`${densityStyles.header} font-bold text-on-surface-variant/70 uppercase tracking-widest cursor-pointer hover:bg-surface-container-high/60 transition-colors`}
                      style={{ minWidth: "200px" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Host / Bound Server</span>
                        {sortField === "server" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-primary" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </div>
                    </th>
                  )}

                  {/* Fleet Status Column */}
                  {visibleColumns.includes("status") && (
                    <th
                      onClick={() => handleSort("status")}
                      className={`${densityStyles.header} font-bold text-on-surface-variant/70 uppercase tracking-widest cursor-pointer hover:bg-surface-container-high/60 transition-colors`}
                      style={{ minWidth: "140px" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Fleet Status</span>
                        {sortField === "status" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-primary" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </div>
                    </th>
                  )}

                  {/* Version & Commit Column */}
                  {visibleColumns.includes("version") && (
                    <th
                      onClick={() => handleSort("version")}
                      className={`${densityStyles.header} font-bold text-on-surface-variant/70 uppercase tracking-widest cursor-pointer hover:bg-surface-container-high/60 transition-colors`}
                      style={{ minWidth: "150px" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Version / Commit</span>
                        {sortField === "version" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-primary" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </div>
                    </th>
                  )}

                  {/* Capabilities Column */}
                  {visibleColumns.includes("capabilities") && (
                    <th
                      className={`${densityStyles.header} font-bold text-on-surface-variant/70 uppercase tracking-widest`}
                      style={{ minWidth: "220px" }}
                    >
                      <span>Active Capabilities & Proof</span>
                    </th>
                  )}

                  {/* Last Heartbeat Column */}
                  {visibleColumns.includes("lastConnected") && (
                    <th
                      onClick={() => handleSort("lastConnected")}
                      className={`${densityStyles.header} font-bold text-on-surface-variant/70 uppercase tracking-widest cursor-pointer hover:bg-surface-container-high/60 transition-colors`}
                      style={{ minWidth: "160px" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Last Heartbeat</span>
                        {sortField === "lastConnected" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-primary" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </div>
                    </th>
                  )}

                  {/* Enrolled Date Column */}
                  {visibleColumns.includes("createdAt") && (
                    <th
                      onClick={() => handleSort("createdAt")}
                      className={`${densityStyles.header} font-bold text-on-surface-variant/70 uppercase tracking-widest cursor-pointer hover:bg-surface-container-high/60 transition-colors`}
                      style={{ minWidth: "140px" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Enrolled At</span>
                        {sortField === "createdAt" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-primary" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </div>
                    </th>
                  )}

                  {/* Actions Column */}
                  {visibleColumns.includes("actions") && (
                    <th
                      className={`${densityStyles.header} font-bold text-on-surface-variant/70 uppercase tracking-widest text-right`}
                      style={{ minWidth: "130px" }}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-outline-variant/10">
                {paginatedAgents.map((agent) => {
                  const badge = statusBadge(agent.status);
                  const isDecommissioned =
                    agent.status.toLowerCase() === "decommissioned" ||
                    agent.status.toLowerCase() === "offline" ||
                    agent.status.toLowerCase() === "revoked";
                  const isExpanded = expandedAgentId === agent.id;

                  // Dynamically extract capabilities/probes from live capabilities_proof
                  const probes: string[] = agent.capabilities_proof
                    ? Array.isArray(agent.capabilities_proof.probes)
                      ? (agent.capabilities_proof.probes as string[])
                      : Array.isArray(agent.capabilities_proof.capabilities)
                      ? (agent.capabilities_proof.capabilities as string[])
                      : Object.keys(agent.capabilities_proof).filter(
                          (k) => typeof agent.capabilities_proof![k] === "boolean" && agent.capabilities_proof![k]
                        )
                    : [];

                  return (
                    <tr
                      key={agent.id}
                      className={`group transition-colors ${
                        isExpanded
                          ? "bg-primary/5"
                          : "hover:bg-surface-container-low/60"
                      }`}
                    >
                      {/* Chevron Toggle Cell */}
                      <td className="py-3 px-2 text-center align-middle">
                        <button
                          onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
                          className={`p-1 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-transform duration-200 ${
                            isExpanded ? "rotate-90 text-primary" : ""
                          }`}
                          title={isExpanded ? "Collapse details" : "Expand full agent telemetry & proofs"}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Agent ID Cell */}
                      {visibleColumns.includes("id") && (
                        <td className={`${densityStyles.cell} align-middle`}>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-primary">
                              {density === "detailed" ? agent.id : `${agent.id.slice(0, 16)}…`}
                            </span>
                            <button
                              onClick={() => handleCopy(agent.id, `id-${agent.id}`)}
                              className="text-on-surface-variant/40 hover:text-primary transition-colors p-0.5"
                              title="Copy full Agent UUID"
                            >
                              {copiedId === `id-${agent.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Server Cell */}
                      {visibleColumns.includes("server") && (
                        <td className={`${densityStyles.cell} align-middle`}>
                          <div className="flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-on-surface-variant/70 shrink-0" />
                            <div className="truncate">
                              <div className="font-semibold text-xs text-on-surface">
                                {agent.server_hostname || agent.server_id}
                              </div>
                              <div className="font-mono text-[10px] text-on-surface-variant/70 flex items-center gap-1">
                                {agent.server_ip && <span>{agent.server_ip}</span>}
                                {agent.server_ip && <span className="opacity-40">•</span>}
                                <span className="truncate max-w-[100px]">{agent.server_id}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Status Cell */}
                      {visibleColumns.includes("status") && (
                        <td className={`${densityStyles.cell} align-middle`}>
                          <span
                            className={`inline-flex items-center gap-1.5 ${densityStyles.chip} rounded-full border font-bold uppercase tracking-wider ${badge.cls}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotCls}`} />
                            {badge.label}
                          </span>
                        </td>
                      )}

                      {/* Version & Commit Cell */}
                      {visibleColumns.includes("version") && (
                        <td className={`${densityStyles.cell} align-middle`}>
                          <div className="flex items-center gap-1 font-mono text-xs text-on-surface">
                            <span className="font-bold">{agent.version || "—"}</span>
                            {agent.git_commit && (
                              <span className="text-[10px] text-on-surface-variant/60 bg-surface-container-high px-1.5 py-0.5 rounded font-mono">
                                #{agent.git_commit.slice(0, 7)}
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Capabilities Proof Cell */}
                      {visibleColumns.includes("capabilities") && (
                        <td className={`${densityStyles.cell} align-middle`}>
                          {probes.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {probes.slice(0, density === "detailed" ? 3 : 2).map((probe: string) => (
                                <span
                                  key={probe}
                                  className="bg-primary/5 text-primary border border-primary/10 text-[9px] font-mono px-1.5 py-0.5 rounded-md"
                                >
                                  {probe.replace(/_/g, " ")}
                                </span>
                              ))}
                              {probes.length > (density === "detailed" ? 3 : 2) && (
                                <span className="text-[9px] text-on-surface-variant/60 font-semibold px-1 py-0.5">
                                  +{probes.length - (density === "detailed" ? 3 : 2)} more
                                </span>
                              )}
                            </div>
                          ) : agent.capabilities_proof ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
                              Cryptographic Proof Registered
                            </span>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant/50 italic">
                              Standard Profile
                            </span>
                          )}
                        </td>
                      )}

                      {/* Last Heartbeat Cell */}
                      {visibleColumns.includes("lastConnected") && (
                        <td className={`${densityStyles.cell} align-middle`}>
                          <div className="text-xs text-on-surface font-medium flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-on-surface-variant/60" />
                            <span>{timeAgo(agent.last_connected_at)}</span>
                          </div>
                          {density === "detailed" && agent.last_connected_at && (
                            <div className="text-[10px] text-on-surface-variant/60 mt-0.5">
                              {formatDate(agent.last_connected_at)}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Enrolled Date Cell */}
                      {visibleColumns.includes("createdAt") && (
                        <td className={`${densityStyles.cell} align-middle text-xs text-on-surface-variant`}>
                          {agent.created_at ? formatDate(agent.created_at) : "—"}
                        </td>
                      )}

                      {/* Actions Cell */}
                      {visibleColumns.includes("actions") && (
                        <td className={`${densityStyles.cell} align-middle text-right`}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Raw Agent Button */}
                            <button
                              onClick={() => setInspectModalAgent(agent)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                              title="Inspect full JSON telemetry and proofs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Lifecycle Toggle */}
                            {actionLoading === agent.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary inline-block" />
                            ) : isDecommissioned ? (
                              <button
                                onClick={() => handleRecommission(agent.id)}
                                disabled={!canManageServer}
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                                  canManageServer
                                    ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                    : "text-gray-400 bg-gray-100 cursor-not-allowed"
                                }`}
                                title={canManageServer ? "Recommission agent" : "Permission 'server.manage' required"}
                              >
                                {canManageServer ? <Power className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                Recommission
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDecommission(agent.id)}
                                disabled={!canManageServer}
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                                  canManageServer
                                    ? "text-red-600 bg-red-50 hover:bg-red-100"
                                    : "text-gray-400 bg-gray-100 cursor-not-allowed"
                                }`}
                                title={canManageServer ? "Decommission agent" : "Permission 'server.manage' required"}
                              >
                                {canManageServer ? <PowerOff className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                Decommission
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Expandable Detail Accordion (Rendered immediately when row is expanded) ── */}
          {expandedAgentId && (() => {
            const expAgent = agents.find((a) => a.id === expandedAgentId);
            if (!expAgent) return null;

            const isExpDecommissioned =
              expAgent.status.toLowerCase() === "decommissioned" ||
              expAgent.status.toLowerCase() === "offline" ||
              expAgent.status.toLowerCase() === "revoked";

            const probes: string[] = expAgent.capabilities_proof
              ? Array.isArray(expAgent.capabilities_proof.probes)
                ? (expAgent.capabilities_proof.probes as string[])
                : Array.isArray(expAgent.capabilities_proof.capabilities)
                ? (expAgent.capabilities_proof.capabilities as string[])
                : Object.keys(expAgent.capabilities_proof).filter(
                    (k) => typeof expAgent.capabilities_proof![k] === "boolean" && expAgent.capabilities_proof![k]
                  )
              : [];

            return (
              <div className="border-t-2 border-primary/20 bg-surface-container-low/40 p-5 animate-[fadeIn_0.2s_ease-out]">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-outline-variant/15 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-on-surface">Agent Deep Inspection</h4>
                        <span className="font-mono text-xs text-primary font-bold bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                          {expAgent.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Bound to host: <strong>{expAgent.server_hostname || expAgent.server_id}</strong> {expAgent.server_ip ? `(${expAgent.server_ip})` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Sub-Tabs for Expanded Drawer */}
                  <div className="flex items-center gap-1 bg-surface-container-high/60 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => setDetailTab("proofs")}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                        detailTab === "proofs"
                          ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Capabilities & Proof
                    </button>
                    <button
                      onClick={() => setDetailTab("server")}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                        detailTab === "server"
                          ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <Server className="w-3.5 h-3.5" /> Host Specs
                    </button>
                    <button
                      onClick={() => setDetailTab("actions")}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                        detailTab === "actions"
                          ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" /> Actions & Config
                    </button>
                  </div>
                </div>

                {/* Sub-Tab Contents */}
                <div className="mt-4">
                  {detailTab === "proofs" && (
                    <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/15 shadow-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-primary" /> Cryptographic Capability Proof
                        </h5>
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(expAgent.capabilities_proof || {}, null, 2),
                              "proof-json"
                            )
                          }
                          className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === "proof-json" ? "Copied!" : "Copy Proof JSON"}
                        </button>
                      </div>

                      {expAgent.capabilities_proof && Object.keys(expAgent.capabilities_proof).length > 0 ? (
                        <div className="p-3 bg-[#0b1021] text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
                          <pre>{JSON.stringify(expAgent.capabilities_proof, null, 2)}</pre>
                        </div>
                      ) : (
                        <p className="text-xs text-on-surface-variant italic py-2">
                          No extended cryptographic proof registered for this agent.
                        </p>
                      )}

                      {probes.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">
                            Extracted Active Probes
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {probes.map((p) => (
                              <span
                                key={p}
                                className="bg-primary/5 text-primary border border-primary/10 text-xs font-mono px-2 py-1 rounded-lg"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {detailTab === "server" && (
                    <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/15 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-surface-container-low rounded-xl">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                          Bound Hostname
                        </span>
                        <div className="font-bold text-xs text-on-surface">
                          {expAgent.server_hostname || "—"}
                        </div>
                        <div className="text-[10px] font-mono text-on-surface-variant mt-0.5">
                          IP: {expAgent.server_ip || "Not reported"}
                        </div>
                      </div>

                      <div className="p-3 bg-surface-container-low rounded-xl">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                          Server Reference ID
                        </span>
                        <div className="font-mono text-xs text-primary truncate select-all">
                          {expAgent.server_id}
                        </div>
                        <button
                          onClick={() => handleCopy(expAgent.server_id, "srv-id")}
                          className="text-[10px] text-primary font-semibold hover:underline mt-1 flex items-center gap-1"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          {copiedId === "srv-id" ? "Copied!" : "Copy Server ID"}
                        </button>
                      </div>

                      <div className="p-3 bg-surface-container-low rounded-xl">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                          Hardware & OS Specs
                        </span>
                        {expAgent.server_specs && Object.keys(expAgent.server_specs).length > 0 ? (
                          <div className="font-mono text-[11px] text-on-surface space-y-0.5">
                            {Object.entries(expAgent.server_specs).map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="text-on-surface-variant">{k}:</span>
                                <span>{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant italic">
                            No hardware specs reported by host.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {detailTab === "actions" && (
                    <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/15 shadow-xs flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-on-surface">Agent Fleet Actions & Tokens</h5>
                        <p className="text-[11px] text-on-surface-variant">
                          Manage registration status or inspect raw agent telemetry payload.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setInspectModalAgent(expAgent)}
                          className="px-3.5 py-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-outline-variant/20"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary" /> View Full Telemetry JSON
                        </button>

                        {isExpDecommissioned ? (
                          <button
                            onClick={() => handleRecommission(expAgent.id)}
                            disabled={!canManageServer}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                              canManageServer
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" /> Recommission Agent
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDecommission(expAgent.id)}
                            disabled={!canManageServer}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                              canManageServer
                                ? "bg-red-600 text-white hover:bg-red-700 shadow-sm"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <PowerOff className="w-3.5 h-3.5" /> Decommission Agent
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Adjustable Pagination Bar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-outline-variant/15 bg-surface-container-low/40 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1 text-xs text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>rows per page</span>
              <span className="opacity-40 ml-2">|</span>
              <span className="ml-2">
                Showing{" "}
                <strong className="text-on-surface">
                  {sortedAgents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-on-surface">
                  {Math.min(currentPage * pageSize, sortedAgents.length)}
                </strong>{" "}
                of <strong className="text-on-surface">{sortedAgents.length}</strong> agents
              </span>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/20 bg-surface-container-lowest font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  if (totalPages > 5 && Math.abs(currentPage - pNum) > 2) return null;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        currentPage === pNum
                          ? "bg-primary text-white shadow-xs"
                          : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-high border border-outline-variant/15"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/20 bg-surface-container-lowest font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Raw Telemetry & Inspector Modal ── */}
      {inspectModalAgent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full border border-outline-variant/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-low">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Sentinel Fleet Agent Inspector</h3>
                  <p className="font-mono text-[10px] text-on-surface-variant">
                    UUID: {inspectModalAgent.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectModalAgent(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal JSON Body */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-[#0b1021] text-emerald-400 rounded-b-none">
              <pre className="whitespace-pre-wrap break-all select-all">
                {JSON.stringify(inspectModalAgent, null, 2)}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-outline-variant/15 bg-surface-container-low flex justify-between items-center">
              <span className="text-[10px] text-on-surface-variant">
                Direct payload from Sentinel Agent Registry
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleCopy(JSON.stringify(inspectModalAgent, null, 2), "modal-json")
                  }
                  className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-container transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId === "modal-json" ? "Copied!" : "Copy JSON"}
                </button>
                <button
                  onClick={() => setInspectModalAgent(null)}
                  className="px-3 py-1.5 bg-surface-container-high text-on-surface text-xs font-semibold rounded-lg hover:bg-surface-container-highest transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
