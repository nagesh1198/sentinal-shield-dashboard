"use client";

import { Calendar, Filter, Layers, Lock, Plus, Server } from "lucide-react";
import { ServerMultiSelect } from "./ServerMultiSelect";
import { SOURCES } from "@/lib/ai/types";
import { DECOY_STATUSES, DECOY_TYPES, MAX_SERVERS, PRESETS, SOURCE_META } from "@/lib/aiScope";
import type { PresetId, ScopeState } from "@/lib/aiScope";
import type { ServerResponse } from "@/lib/types";

interface Props {
  servers: ServerResponse[];
  serversLoading: boolean;
  serversError: string | null;
  onRetryServers: () => void;
  scope: ScopeState;
  onChange: (next: ScopeState) => void;
  errors: string[];
  locked: boolean;
  onNewAnalysis: () => void;
}

const sectionTitle = "mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary";
const fieldClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-2.5 py-2 text-xs text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60";

export function ScopePanel({ servers, serversLoading, serversError, onRetryServers, scope, onChange, errors, locked, onNewAnalysis }: Props) {
  const set = (patch: Partial<ScopeState>) => onChange({ ...scope, ...patch });
  const toggleSource = (s: (typeof SOURCES)[number]) =>
    set({ sources: scope.sources.includes(s) ? scope.sources.filter((x) => x !== s) : [...scope.sources, s] });
  const hostnames = scope.serverIds.map((id) => servers.find((s) => s.id === id)?.hostname ?? id);
  const presetLabel = scope.preset === "custom" ? "Custom range" : `Last ${PRESETS.find((p) => p.id === scope.preset)?.label}`;

  if (locked) {
    return (
      <aside className="flex h-full flex-col rounded-2xl border border-outline-variant/10 bg-white p-4 shadow-sm" aria-label="Analysis scope (locked)">
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary">Scope · locked</h2>
        </div>
        <p className="mb-4 text-[11px] leading-5 text-on-surface-variant">Follow-up questions use this scope. Start a new analysis to change servers, time range or sources.</p>
        <dl className="space-y-3 text-xs">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Servers</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {hostnames.map((h) => (
                <span key={h} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {h}
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Time range</dt>
            <dd className="mt-1 text-on-surface">{presetLabel}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Sources</dt>
            <dd className="mt-1 text-on-surface">{scope.sources.map((s) => SOURCE_META[s].label).join(", ")}</dd>
          </div>
          {(scope.decoyType || scope.status) && (
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Filters</dt>
              <dd className="mt-1 font-mono text-[11px] text-on-surface">{[scope.decoyType && `type=${scope.decoyType}`, scope.status && `status=${scope.status}`].filter(Boolean).join("  ")}</dd>
            </div>
          )}
        </dl>
        <button
          type="button"
          onClick={onNewAnalysis}
          className="mt-auto flex items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> New analysis
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col gap-5 overflow-y-auto rounded-2xl border border-outline-variant/10 bg-white p-4 shadow-sm" aria-label="Analysis scope">
      <section>
        <h2 className={sectionTitle}>
          <Server className="h-3.5 w-3.5" /> Servers
        </h2>
        <ServerMultiSelect
          servers={servers}
          selected={scope.serverIds}
          onChange={(serverIds) => set({ serverIds })}
          max={MAX_SERVERS}
          loading={serversLoading}
          error={serversError}
          onRetry={onRetryServers}
          hasError={errors.some((e) => /server/i.test(e))}
        />
      </section>

      <section>
        <h2 className={sectionTitle}>
          <Calendar className="h-3.5 w-3.5" /> Time range
        </h2>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Time range">
          {[...PRESETS.map((p) => ({ id: p.id as PresetId, label: p.label })), { id: "custom" as PresetId, label: "Custom" }].map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={scope.preset === p.id}
              onClick={() => set({ preset: p.id })}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                scope.preset === p.id ? "bg-primary text-white shadow shadow-primary/20" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {scope.preset === "custom" && (
          <div className="mt-3 grid grid-cols-1 gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              From
              <input type="datetime-local" value={scope.customFrom} onChange={(e) => set({ customFrom: e.target.value })} className={`${fieldClass} mt-1 font-normal normal-case tracking-normal`} />
            </label>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              To
              <input type="datetime-local" value={scope.customTo} onChange={(e) => set({ customTo: e.target.value })} className={`${fieldClass} mt-1 font-normal normal-case tracking-normal`} />
            </label>
            <p className="text-[10px] text-on-surface-variant">Maximum 30 days.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className={sectionTitle}>
          <Layers className="h-3.5 w-3.5" /> Data sources
        </h2>
        <ul className="space-y-1.5">
          {SOURCES.map((s) => (
            <li key={s}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl p-2 transition-colors hover:bg-surface-container-low">
                <input type="checkbox" checked={scope.sources.includes(s)} onChange={() => toggleSource(s)} className="mt-0.5 h-3.5 w-3.5 accent-[#001b85]" />
                <span>
                  <span className="block text-xs font-semibold text-on-surface">{SOURCE_META[s].label}</span>
                  <span className="block text-[10px] leading-4 text-on-surface-variant">{SOURCE_META[s].hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className={sectionTitle}>
          <Filter className="h-3.5 w-3.5" /> Filters <span className="font-normal normal-case tracking-normal text-on-surface-variant">(optional)</span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Decoy type
            <select value={scope.decoyType} onChange={(e) => set({ decoyType: e.target.value })} className={`${fieldClass} mt-1 font-normal normal-case tracking-normal`}>
              <option value="">Any</option>
              {DECOY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Status
            <select value={scope.status} onChange={(e) => set({ status: e.target.value })} className={`${fieldClass} mt-1 font-normal normal-case tracking-normal`}>
              <option value="">Any</option>
              {DECOY_STATUSES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-1.5 text-[10px] text-on-surface-variant">Filters apply to decoy records.</p>
      </section>

      {errors.length > 0 && (
        <ul className="rounded-xl border border-error/20 bg-error/5 p-3 text-[11px] text-error" role="alert">
          {errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}
