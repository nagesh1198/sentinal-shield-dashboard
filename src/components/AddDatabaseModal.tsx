"use client";

import { useState } from "react";
import { X, Database, ChevronDown, CheckCircle } from "lucide-react";

interface AddDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DB_TYPES = ["PostgreSQL", "MySQL", "Redis", "MongoDB", "MSSQL", "SQLite"];
const DETECTION_MODES = ["Key Access Observability", "Schema Read Monitor", "Full Query Logging", "Canary Row Trigger"];

export function AddDatabaseModal({ isOpen, onClose }: AddDatabaseModalProps) {
  const [form, setForm] = useState({
    name: "", host: "", dbType: "PostgreSQL",
    schemas: "", detectionMode: "Key Access Observability", canaryCount: "5",
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit() {
    if (!form.name || !form.host) return;
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); }, 1800);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[fadeUp_0.2s_ease]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Database className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface">Add Deception Database</h2>
              <p className="text-[10px] text-on-surface-variant">Configure canary schema and detection mode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors">
            <X className="w-4 h-4 text-on-surface-variant" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-on-surface">Database Registered</p>
            <p className="text-xs text-on-surface-variant">Canary monitoring is now active</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* DB Name */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">Database Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. PostgreSQL Main"
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            {/* DB Type */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">Database Type</label>
              <div className="relative">
                <select
                  value={form.dbType}
                  onChange={e => setForm(f => ({ ...f, dbType: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary/40 transition-colors appearance-none"
                >
                  {DB_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            {/* Host */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">Host / Connection String</label>
              <input
                value={form.host}
                onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
                placeholder="e.g. db.prod.internal"
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            {/* Schemas */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">Monitored Schemas <span className="font-normal normal-case tracking-normal">(comma separated)</span></label>
              <input
                value={form.schemas}
                onChange={e => setForm(f => ({ ...f, schemas: e.target.value }))}
                placeholder="e.g. _system_config, user_secrets"
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            {/* Detection Mode */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">Detection Mode</label>
              <div className="relative">
                <select
                  value={form.detectionMode}
                  onChange={e => setForm(f => ({ ...f, detectionMode: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary/40 transition-colors appearance-none"
                >
                  {DETECTION_MODES.map(m => <option key={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            {/* Canary Count */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">Canary Count</label>
              <div className="flex gap-2">
                {["3", "5", "10", "20"].map(n => (
                  <button
                    key={n}
                    onClick={() => setForm(f => ({ ...f, canaryCount: n }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${form.canaryCount === n ? "bg-primary text-white border-primary" : "border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.host}
                className="px-6 py-2.5 rounded-full text-sm font-bold bg-primary text-white hover:bg-primary-container transition-colors shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Register Database
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
