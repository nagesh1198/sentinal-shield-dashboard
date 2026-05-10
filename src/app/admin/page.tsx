import { DashboardLayout } from "@/components/DashboardLayout";
import { KillSwitchPanel } from "@/components/KillSwitchPanel";
import { Users, Activity, Lock, Cpu, MemoryStick } from "lucide-react";

const analysts = [
  { name: "Lead Analyst",  initials: "LA", level: 4, status: "Active",  lastSeen: "Now" },
  { name: "Sec Engineer",  initials: "SE", level: 3, status: "Active",  lastSeen: "4 min ago" },
  { name: "Auditor",       initials: "AU", level: 2, status: "Idle",    lastSeen: "22 min ago" },
  { name: "Viewer",        initials: "VW", level: 1, status: "Offline", lastSeen: "2 hrs ago" },
];

const auditTrail = [
  { action: "Viewed forensic archive",          user: "LA", ts: "14:02:11" },
  { action: "Triggered Brute Force playbook",   user: "LA", ts: "13:58:00" },
  { action: "Ran SQL query on logs table",      user: "SE", ts: "13:45:00" },
  { action: "Reviewed NODE-02 isolation",       user: "AU", ts: "13:30:18" },
];

export default function AdminPage() {
  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider">Admin Control</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Privileged system access — Access Level 4 required</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-error-container rounded-full border border-error/20">
          <Lock className="w-3.5 h-3.5 text-error" />
          <span className="text-xs font-bold text-error">Restricted Zone</span>
        </div>
      </header>

      {/* Kill Switch Panel */}
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/10 shadow-sm mb-6">
        <KillSwitchPanel />
      </div>

      {/* Lower Grid — Telemetry + Analysts + Audit */}
      <div className="grid grid-cols-12 gap-6">
        {/* Telemetry */}
        <section className="col-span-8">
          <h2 className="text-base font-bold text-primary mb-3">System Resource Telemetry</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { node: "NODE-01", cpu: 12, mem: 26, cpuColor: "bg-primary",     memColor: "bg-primary-container" },
              { node: "NODE-02", cpu: 78, mem: 93, cpuColor: "bg-error",       memColor: "bg-amber-500" },
              { node: "NODE-03", cpu: 5,  mem: 13, cpuColor: "bg-primary",     memColor: "bg-primary-container" },
              { node: "NODE-04", cpu: 0,  mem: 0,  cpuColor: "bg-outline-variant/30", memColor: "bg-outline-variant/20" },
            ].map((n) => (
              <div key={n.node} className="bg-white rounded-xl p-4 border border-outline-variant/10 shadow-sm">
                <p className="text-xs font-bold text-on-surface mb-3">{n.node}</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[9px] text-on-surface-variant mb-1">
                      <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> CPU</span>
                      <span>{n.cpu}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                      <div className={`h-full ${n.cpuColor} rounded-full`} style={{ width: `${n.cpu}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-on-surface-variant mb-1">
                      <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3" /> Mem</span>
                      <span>{n.mem}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                      <div className={`h-full ${n.memColor} rounded-full`} style={{ width: `${n.mem}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Analysts + Audit */}
        <section className="col-span-4 space-y-4">
          {/* Analysts */}
          <div className="bg-white rounded-2xl p-4 border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Analysts</h3>
            </div>
            <div className="space-y-2.5">
              {analysts.map((a) => (
                <div key={a.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{a.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-on-surface">{a.name}</p>
                    <p className="text-[9px] text-on-surface-variant">Level {a.level} · {a.lastSeen}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${a.status === "Active" ? "bg-emerald-100 text-emerald-700" : a.status === "Idle" ? "bg-amber-100 text-amber-700" : "bg-surface-container-high text-on-surface-variant"}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-2xl p-4 border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Audit Trail</h3>
            </div>
            <div className="space-y-2.5">
              {auditTrail.map((a, i) => (
                <div key={i} className="flex gap-2 text-xs pb-2 border-b border-outline-variant/5 last:border-0">
                  <span className="font-bold text-primary bg-primary/5 px-1.5 rounded shrink-0">{a.user}</span>
                  <span className="text-on-surface-variant flex-1">{a.action}</span>
                  <span className="font-mono text-[9px] text-on-surface-variant/50 shrink-0">{a.ts}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
