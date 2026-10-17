"use client";

import React, { useEffect, useState, useId } from "react";
import { Cpu, MemoryStick, Activity, Clock, Zap, ArrowUpRight, Monitor, Server, ChevronDown } from "lucide-react";

export interface DynamicResourceWaveProps {
  label: "CPU" | "Memory" | string;
  value: number; // percentage 0 - 100
  subvalue?: string; // e.g. "14 / 32 GB" or "3.4 GHz"
  colorTheme?: "emerald" | "blue" | "purple" | "cyan" | "amber" | "crimson";
  isOnline?: boolean;
  height?: number;
  showIcon?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  memoryTotalGB?: number;
  memoryUsedGB?: number;
  speed?: string;
  cores?: string;
  uptime?: string;
}

/**
 * Windows Task Manager Style Resource Utilization Graph:
 * Faithful reproduction of the Windows Task Manager Performance tab CPU & Memory charts:
 * - 60-second rolling history time series with crisp 10x4 grid cells
 * - 100% / 0% Y-axis labels and "60 seconds" X-axis label
 * - Task Manager Blue (#0ea5e9 / #0078d4) for CPU, Task Manager Purple (#8b5cf6 / #a855f7) for Memory
 * - Giant percentage readouts and authentic Windows Task Manager telemetry footers
 */
export function DynamicResourceWave({
  label,
  value,
  subvalue,
  colorTheme,
  isOnline = true,
  height = 110,
  showIcon = true,
  showDetails = true,
  compact = false,
  memoryTotalGB = 32,
  memoryUsedGB,
  speed = "3.40 GHz",
  cores = "8 (16 Logical)",
  uptime = "07:14:22:05",
}: DynamicResourceWaveProps) {
  const gradientId = useId();
  const isCpu = label.toLowerCase().includes("cpu");
  const historyLength = 60; // 60 seconds history like Windows Task Manager

  // Initialize 60 seconds rolling history
  const [history, setHistory] = useState<number[]>(() => {
    const initial: number[] = [];
    const base = isOnline ? value : 0;
    for (let i = 0; i < historyLength; i++) {
      const variation = (Math.sin(i * 0.3) + Math.cos(i * 0.55)) * 3.2;
      initial.push(Math.min(100, Math.max(0, Math.round(base + variation))));
    }
    return initial;
  });

  const [currentVal, setCurrentVal] = useState<number>(value);

  // Update rolling 60-second buffer every second (1000ms = 1 second Task Manager tick)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOnline) {
        setCurrentVal(0);
        setHistory((prev) => [...prev.slice(1), 0]);
        return;
      }

      // Natural micro-telemetry fluctuations like real Windows Task Manager (+/- 2.5%)
      const delta = (Math.random() - 0.5) * 5.2;
      const newPoint = Math.min(100, Math.max(1, Math.round(value + delta)));
      setCurrentVal(newPoint);
      setHistory((prev) => [...prev.slice(1), newPoint]);
    }, 1000);

    return () => clearInterval(interval);
  }, [value, isOnline]);

  // Color schemes matching Windows Task Manager Performance tab:
  // CPU = Windows Task Manager Blue (#0078d4 / #0ea5e9)
  // Memory = Windows Task Manager Purple (#8b5cf6 / #a855f7)
  const defaultTheme = isCpu ? "blue" : "purple";
  const activeTheme = !isOnline
    ? "crimson"
    : currentVal > 85
    ? "crimson"
    : currentVal > 75
    ? "amber"
    : colorTheme || defaultTheme;

  const colorStyles = {
    blue: {
      line: "#0ea5e9", // Windows Task Manager CPU cyan/blue
      fillTop: "rgba(14, 165, 233, 0.40)",
      fillBottom: "rgba(14, 165, 233, 0.04)",
      point: "#38bdf8",
      accentText: "text-sky-400",
      borderGlow: "border-sky-500/20",
      headerBadge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
    purple: {
      line: "#8b5cf6", // Windows Task Manager Memory purple
      fillTop: "rgba(139, 92, 246, 0.40)",
      fillBottom: "rgba(139, 92, 246, 0.04)",
      point: "#c084fc",
      accentText: "text-purple-400",
      borderGlow: "border-purple-500/20",
      headerBadge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    emerald: {
      line: "#10b981",
      fillTop: "rgba(16, 185, 129, 0.40)",
      fillBottom: "rgba(16, 185, 129, 0.04)",
      point: "#34d399",
      accentText: "text-emerald-400",
      borderGlow: "border-emerald-500/20",
      headerBadge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    cyan: {
      line: "#06b6d4",
      fillTop: "rgba(6, 182, 212, 0.40)",
      fillBottom: "rgba(6, 182, 212, 0.04)",
      point: "#22d3ee",
      accentText: "text-cyan-400",
      borderGlow: "border-cyan-500/20",
      headerBadge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    amber: {
      line: "#f59e0b",
      fillTop: "rgba(245, 158, 11, 0.45)",
      fillBottom: "rgba(245, 158, 11, 0.04)",
      point: "#fbbf24",
      accentText: "text-amber-400",
      borderGlow: "border-amber-500/30",
      headerBadge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    crimson: {
      line: "#ef4444",
      fillTop: "rgba(239, 68, 68, 0.45)",
      fillBottom: "rgba(239, 68, 68, 0.04)",
      point: "#f87171",
      accentText: "text-red-400",
      borderGlow: "border-red-500/30",
      headerBadge: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  }[activeTheme];

  // ── Construct Graph Path with 60s Points ──
  const graphWidth = 360;
  const graphHeight = Math.max(50, height);
  const paddingTop = 6;
  const paddingBottom = 4;
  const chartHeight = graphHeight - paddingTop - paddingBottom;

  const points: [number, number][] = history.map((val, i) => {
    const x = (i / (historyLength - 1)) * graphWidth;
    // Invert: 100% at top, 0% at bottom
    const y = paddingTop + chartHeight * (1 - Math.min(100, Math.max(0, val)) / 100);
    return [x, y];
  });

  // Construct smooth SVG path
  let linePath = `M ${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev[0] + curr[0]) / 2;
    linePath += ` Q ${prev[0].toFixed(1)},${prev[1].toFixed(1)} ${midX.toFixed(1)},${((prev[1] + curr[1]) / 2).toFixed(1)} T ${curr[0].toFixed(1)},${curr[0].toFixed(1)}`;
  }

  // Area fill polygon under the graph
  const areaPath = `${linePath} L ${graphWidth},${graphHeight} L 0,${graphHeight} Z`;

  // Latest rightmost value coordinate
  const latestPoint = points[points.length - 1];

  // Technical metric details for Task Manager bottom panel
  const computedMemUsed = memoryUsedGB !== undefined
    ? memoryUsedGB
    : parseFloat(((memoryTotalGB * currentVal) / 100).toFixed(1));
  const computedMemAvail = parseFloat((memoryTotalGB - computedMemUsed).toFixed(1));

  return (
    <div className={`bg-[#0b0f19] rounded-xl border border-slate-800 shadow-xl text-slate-100 font-sans select-none ${compact ? "p-3 space-y-2" : "p-4 space-y-3"}`}>
      {/* ── Task Manager Window Header: Big Title & Large % Utilization ── */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            {showIcon && (
              isCpu ? (
                <Cpu className={`w-4 h-4 ${colorStyles.accentText}`} />
              ) : (
                <MemoryStick className={`w-4 h-4 ${colorStyles.accentText}`} />
              )
            )}
            <h4 className="text-sm font-bold tracking-tight text-white uppercase">
              {label}
            </h4>
            {isOnline ? (
              <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            ) : (
              <span className="text-[9px] font-mono text-red-400 bg-red-950/60 border border-red-500/30 px-1.5 py-0.2 rounded font-bold">
                OFFLINE
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
            {isCpu ? "% Utilization" : subvalue || `In Use: ${computedMemUsed} GB`}
          </p>
        </div>

        {/* Big Task Manager Value Readout */}
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className={`text-2xl font-bold font-mono tracking-tight ${colorStyles.accentText}`}>
              {isOnline ? `${currentVal}%` : "0%"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {isCpu ? speed : `${computedMemUsed} / ${memoryTotalGB} GB`}
          </p>
        </div>
      </div>

      {/* ── Windows Task Manager Chart Box (10x4 Grid Window) ── */}
      <div
        className={`relative w-full rounded-md overflow-hidden bg-[#06080e] border ${colorStyles.borderGlow}`}
        style={{ height: graphHeight }}
      >
        {/* Windows Task Manager 10-column x 4-row Grid Cells */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical cell lines (10 equal columns) */}
          <div className="w-full h-full flex justify-between">
            {Array.from({ length: 11 }).map((_, idx) => (
              <div
                key={`v-${idx}`}
                className="h-full border-r border-[#1a2333]/70"
              />
            ))}
          </div>
          {/* Horizontal cell lines (4 equal rows = 0%, 25%, 50%, 75%, 100%) */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={`h-${idx}`}
                className="w-full border-b border-[#1a2333]/70"
              />
            ))}
          </div>
        </div>

        {/* Task Manager 100% / 0% Y-axis Corner Watermarks */}
        <div className="absolute top-1 right-1.5 text-[8px] font-mono text-slate-400/80 pointer-events-none z-20">
          100 %
        </div>
        <div className="absolute bottom-1 right-1.5 text-[8px] font-mono text-slate-400/80 pointer-events-none z-20">
          0 %
        </div>
        <div className="absolute bottom-1 left-2 text-[8px] font-mono text-slate-400/80 pointer-events-none z-20 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 text-slate-400/60" />
          <span>60 seconds</span>
        </div>

        {/* Continuous SVG Graph Curve & Area Gradient */}
        <svg
          viewBox={`0 0 ${graphWidth} ${graphHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full relative z-10"
        >
          <defs>
            <linearGradient id={`tm-fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorStyles.fillTop} />
              <stop offset="100%" stopColor={colorStyles.fillBottom} />
            </linearGradient>
            <filter id={`tm-glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="1.5"
                floodColor={colorStyles.line}
                floodOpacity="0.8"
              />
            </filter>
          </defs>

          {/* Semi-transparent area fill underneath graph line */}
          <path d={areaPath} fill={`url(#tm-fill-${gradientId})`} />

          {/* Main graph polyline */}
          <path
            d={linePath}
            fill="none"
            stroke={colorStyles.line}
            strokeWidth={isOnline ? "2.2" : "1.8"}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#tm-glow-${gradientId})`}
          />

          {/* Real-time rightmost pulsing cursor dot */}
          {isOnline && (
            <>
              <circle
                cx={latestPoint[0]}
                cy={latestPoint[1]}
                r="4"
                fill={colorStyles.point}
                opacity="0.4"
                className="animate-ping"
              />
              <circle
                cx={latestPoint[0]}
                cy={latestPoint[1]}
                r="2.5"
                fill="#ffffff"
                stroke={colorStyles.line}
                strokeWidth="1.5"
              />
            </>
          )}
        </svg>
      </div>

      {/* ── Task Manager Bottom Technical Telemetry Panel ── */}
      {showDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
          {isCpu ? (
            <>
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider">Speed</p>
                <p className="font-bold text-white">{speed}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider">Cores</p>
                <p className="font-bold text-white">{cores}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider">Processes</p>
                <p className="font-bold text-white">184</p>
              </div>
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider">Up time</p>
                <p className="font-bold text-emerald-400">{uptime}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider">In use</p>
                <p className="font-bold text-white">{computedMemUsed} GB</p>
              </div>
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider">Available</p>
                <p className="font-bold text-white">{computedMemAvail} GB</p>
              </div>
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider">Committed</p>
                <p className="font-bold text-white">{computedMemUsed} / {(memoryTotalGB * 1.15).toFixed(1)} GB</p>
              </div>
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider">Speed</p>
                <p className="font-bold text-purple-400">3200 MT/s</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Windows Task Manager Side-by-Side Performance Panel:
 * Pair of authentic Windows Task Manager Windows (CPU & Memory)
 * with server switcher and cluster telemetry.
 */
export function WindowsTaskManagerPanel({
  server,
  allServers = [],
  onSelectServer,
}: {
  server: {
    id: string;
    serverId: string;
    hostname: string;
    ip: string;
    location: string;
    status: string;
    cpu: number | null;
    memoryUsed: number | null;
    memoryTotal: number | null;
    isOnline: boolean;
  };
  allServers?: Array<{
    id: string;
    serverId: string;
    hostname: string;
    ip: string;
    status: string;
    cpu: number | null;
    memoryUsed: number | null;
    memoryTotal: number | null;
    isOnline: boolean;
  }>;
  onSelectServer?: (serverId: string) => void;
}) {
  const cpuVal = typeof server.cpu === "number" ? Math.round(server.cpu) : 28;
  const memTotal = server.memoryTotal || 32;
  const memUsed = server.memoryUsed || Math.round((memTotal * 0.44));
  const memPercent = Math.round((memUsed / memTotal) * 100);

  return (
    <div className="bg-[#090d16] rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4">
      {/* Task Manager Window Header Bar */}
      <div className="flex justify-between items-center flex-wrap gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-sans">
                Task Manager <span className="text-slate-400 font-normal">| Performance</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-semibold border border-slate-700">
                Windows 11 Aero Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Live telemetry for: <strong className="text-white">{server.hostname}</strong> ({server.ip})
            </p>
          </div>
        </div>

        {/* Server Selector Pills */}
        {allServers.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mr-1">
              Select Node:
            </span>
            {allServers.slice(0, 4).map((s) => {
              const isSelected = s.serverId === server.serverId;
              return (
                <button
                  key={s.serverId}
                  type="button"
                  onClick={() => onSelectServer?.(s.serverId)}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg transition-all border ${
                    isSelected
                      ? "bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold shadow-xs"
                      : "bg-slate-900/60 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  {s.hostname}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Side-by-side Task Manager Windows: CPU on Left, Memory on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CPU Window */}
        <DynamicResourceWave
          label="CPU"
          value={cpuVal}
          colorTheme="blue"
          isOnline={server.isOnline}
          height={125}
          showIcon={true}
          showDetails={true}
          speed="3.40 GHz"
          cores="8 (16 Logical)"
          uptime="07:14:22:05"
        />

        {/* Memory Window */}
        <DynamicResourceWave
          label="Memory"
          value={memPercent}
          colorTheme="purple"
          isOnline={server.isOnline}
          height={125}
          showIcon={true}
          showDetails={true}
          memoryTotalGB={memTotal}
          memoryUsedGB={memUsed}
          subvalue={`${memUsed} / ${memTotal} GB (${memPercent}%)`}
        />
      </div>
    </div>
  );
}

// Alias for convenience
export const TaskManagerGraph = DynamicResourceWave;
