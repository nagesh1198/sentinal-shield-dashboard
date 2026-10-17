"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { agentService } from "@/services/agentService";
import type { AgentResponse } from "@/lib/types";
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
} from "lucide-react";

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "active" || s === "online" || s === "healthy")
    return {
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: <CheckCircle className="w-3 h-3" />,
    };
  if (s === "decommissioned" || s === "offline")
    return {
      cls: "bg-red-50 text-red-600 border-red-200",
      icon: <XCircle className="w-3 h-3" />,
    };
  if (s === "warning" || s === "degraded")
    return {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <AlertTriangle className="w-3 h-3" />,
    };
  return {
    cls: "bg-gray-100 text-gray-600 border-gray-200",
    icon: <Clock className="w-3 h-3" />,
  };
}

function formatDate(iso: string | null): string {
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

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAgents = () => {
    setLoading(true);
    setError(null);
    agentService
      .getAgents()
      .then((data) => {
        setAgents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleDecommission = async (agentId: string) => {
    setActionLoading(agentId);
    try {
      await agentService.decommission(agentId);
      fetchAgents();
    } catch (err) {
      alert(`Decommission failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecommission = async (agentId: string) => {
    setActionLoading(agentId);
    try {
      await agentService.recommission(agentId);
      fetchAgents();
    } catch (err) {
      alert(`Recommission failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider">
            Agents
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Sentinel agent fleet management & monitoring
          </p>
        </div>
        <button
          onClick={fetchAgents}
          className="bg-surface-container-high text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-surface-container-highest transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="flex items-center gap-2 text-xs text-error bg-error-container/15 border border-error/15 rounded-lg px-3 py-2 mb-4">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && agents.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          <span>Loading agents...</span>
        </div>
      ) : agents.length === 0 && !error ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/10">
          <Bot className="w-12 h-12 text-primary/20 mx-auto mb-4" />
          <p className="text-sm text-on-surface-variant">
            No agents registered yet. Agents will appear here once servers are
            onboarded.
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/15 bg-surface-container-low">
                <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  Agent ID
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  Server
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  Version
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  Last Connected
                </th>
                <th className="text-right py-3 px-4 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const badge = statusBadge(agent.status);
                const isDecommissioned =
                  agent.status.toLowerCase() === "decommissioned" ||
                  agent.status.toLowerCase() === "offline";

                return (
                  <tr
                    key={agent.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-on-surface">
                      {agent.id.slice(0, 12)}…
                    </td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant">
                      {agent.server_id.slice(0, 12)}…
                    </td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant">
                      {agent.version || "—"}
                      {agent.git_commit && (
                        <span className="text-[9px] text-on-surface-variant/50 ml-1">
                          ({agent.git_commit.slice(0, 7)})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${badge.cls}`}
                      >
                        {badge.icon}
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant">
                      {formatDate(agent.last_connected_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {actionLoading === agent.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary inline-block" />
                      ) : isDecommissioned ? (
                        <button
                          onClick={() => handleRecommission(agent.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <Power className="w-3 h-3" />
                          Recommission
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDecommission(agent.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <PowerOff className="w-3 h-3" />
                          Decommission
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
