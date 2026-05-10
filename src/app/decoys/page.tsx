"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Ghost, Plus, FolderOpen, Eye, ShieldAlert, X, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface DecoyPath {
  id: string; path: string; node: string; fileCount: number;
  enabled: boolean; accesses: number; lastAccess: string | null;
  type: "File" | "Directory" | "Process";
}

const decoys: DecoyPath[] = [
  { id: "DC-001", path: "/etc/shadow.bak", node: "NODE-01", fileCount: 1, enabled: true, accesses: 0, lastAccess: null, type: "File" },
  { id: "DC-002", path: "/var/backup/db_credentials.txt", node: "NODE-02", fileCount: 1, enabled: true, accesses: 2, lastAccess: "13:30:22", type: "File" },
  { id: "DC-003", path: "/opt/secrets/", node: "NODE-01", fileCount: 6, enabled: true, accesses: 0, lastAccess: null, type: "Directory" },
  { id: "DC-004", path: "/home/admin/.ssh/id_rsa_backup", node: "NODE-03", fileCount: 1, enabled: false, accesses: 0, lastAccess: null, type: "File" },
  { id: "DC-005", path: "/tmp/.hidden_agent", node: "NODE-02", fileCount: 1, enabled: true, accesses: 1, lastAccess: "14:01:05", type: "Process" },
  { id: "DC-006", path: "/var/lib/docker/secrets/", node: "NODE-03", fileCount: 4, enabled: true, accesses: 0, lastAccess: null, type: "Directory" },
];

const typeIcon = { File: FolderOpen, Directory: FolderOpen, Process: Ghost };
const typeColor = { File: "bg-primary/5 text-primary", Directory: "bg-amber-50 text-amber-600", Process: "bg-purple-50 text-purple-600" };

export default function DecoysPage() {
  const [items, setItems] = useState<DecoyPath[]>(decoys);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ path: "", node: "NODE-01", type: "File" as DecoyPath["type"] });

  function toggleEnabled(id: string) {
    setItems(prev => prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d));
  }

  const triggered = items.filter(d => d.accesses > 0);
  const active = items.filter(d => d.enabled && d.accesses === 0).length;

  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider flex items-center gap-2">
            <Ghost className="w-6 h-6 text-purple-500" /> Decoys
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Fake files, directories and processes planted in realistic but never-touched paths.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20">
          <Plus className="w-4 h-4" /> Add Decoy
        </button>
      </header>

      {/* Summary */}
      <div className="flex gap-4 mb-6">
        {[
          { label: "Total Decoys", value: items.length, color: "text-primary" },
          { label: "Active", value: active, color: "text-emerald-600" },
          { label: "Accessed", value: triggered.length, color: "text-error" },
          { label: "Disabled", value: items.filter(d => !d.enabled).length, color: "text-on-surface-variant" },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-white rounded-2xl p-4 border border-outline-variant/10 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Triggered Banner */}
      {triggered.length > 0 && (
        <div className="flex items-center gap-3 bg-error/5 border border-error/20 rounded-xl px-4 py-3 mb-4">
          <ShieldAlert className="w-4 h-4 text-error shrink-0" />
          <p className="text-xs text-error font-semibold">
            {triggered.length} decoy path{triggered.length > 1 ? "s have" : " has"} been accessed — potential lateral movement detected.
          </p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Decoy Cards */}
        <section className="col-span-8 space-y-3">
          {items.map(d => {
            const Icon = typeIcon[d.type];
            return (
              <div key={d.id} className={`bg-white rounded-2xl px-5 py-4 border shadow-sm flex items-center gap-4 transition-all hover:shadow-md group ${d.accesses > 0 ? "border-error/20 bg-error/[0.01]" : "border-outline-variant/10"}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeColor[d.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-mono font-semibold text-on-surface truncate">{d.path}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${typeColor[d.type]}`}>{d.type}</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant">{d.node} · {d.fileCount} file{d.fileCount > 1 ? "s" : ""} planted</p>
                </div>
                <div className="text-right min-w-[90px]">
                  {d.accesses > 0 ? (
                    <>
                      <p className="text-xs font-bold text-error">{d.accesses}x accessed</p>
                      <p className="text-[9px] font-mono text-on-surface-variant/60">{d.lastAccess}</p>
                    </>
                  ) : (
                    <p className="text-[10px] text-emerald-600 font-medium">Undisturbed</p>
                  )}
                </div>
                <button onClick={() => toggleEnabled(d.id)} className="shrink-0">
                  {d.enabled
                    ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                    : <ToggleLeft className="w-6 h-6 text-on-surface-variant/30" />}
                </button>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button className="p-1.5 hover:bg-surface-container-high rounded-lg"><Eye className="w-3.5 h-3.5 text-on-surface-variant" /></button>
                  <button className="p-1.5 hover:bg-error-container rounded-lg"><Trash2 className="w-3.5 h-3.5 text-error" /></button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Guidance Panel */}
        <section className="col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Placement Strategy</p>
            <div className="space-y-3">
              {[
                { tip: "Place in backup dirs", detail: "/var/backup/, /tmp/ — attacker staging zones" },
                { tip: "Mimic real file names", detail: "credentials.txt, id_rsa_backup, config.bak" },
                { tip: "Use realistic permissions", detail: "0600 for keys, 0644 for configs" },
                { tip: "Never touch them yourself", detail: "Any access = guaranteed attacker signal" },
              ].map((t, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                  <div>
                    <p className="text-xs font-semibold text-on-surface">{t.tip}</p>
                    <p className="text-[10px] text-on-surface-variant">{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-widest mb-1">File Canary Engine</p>
            <p className="text-xs text-purple-800">Kernel-level eBPF probes monitor all file open() calls. Access to a decoy path triggers an immediate high-priority alert.</p>
          </div>
        </section>
      </div>

      {/* Add Decoy Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-[fadeUp_0.2s_ease]">
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Ghost className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Add Decoy Path</p>
                  <p className="text-[10px] text-on-surface-variant">Plant a fake asset as a tripwire</p>
                </div>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-surface-container-high rounded-full"><X className="w-4 h-4 text-on-surface-variant" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">Decoy Path</label>
                <input value={form.path} onChange={e => setForm(f => ({ ...f, path: e.target.value }))} placeholder="e.g. /var/backup/credentials.txt" className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm font-mono text-on-surface outline-none focus:border-primary/40 placeholder:text-on-surface-variant/40" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">Decoy Type</label>
                <div className="flex gap-2">
                  {(["File", "Directory", "Process"] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${form.type === t ? "bg-purple-600 text-white border-purple-600" : "border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">Deploy To Node</label>
                <select value={form.node} onChange={e => setForm(f => ({ ...f, node: e.target.value }))} className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary/40 appearance-none">
                  {["NODE-01", "NODE-02", "NODE-03", "NODE-04"].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-full border border-outline-variant/20 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">Cancel</button>
                <button disabled={!form.path} onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-full bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-40">Plant Decoy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
