import { DashboardLayout } from "@/components/DashboardLayout";
import { Zap, ShieldCheck, RotateCcw, Ban, CheckCircle, Clock } from "lucide-react";

const playbooks = [
  {
    id: 1, name: "Brute Force Mitigation", status: "Armed", lastRun: "2 hrs ago",
    rules: ["Block IP after 5 failed auths", "Alert analyst on-call", "Log to forensics vault"],
    triggers: 14, color: "text-primary", bg: "bg-primary/5",
  },
  {
    id: 2, name: "DDoS Traffic Scrubbing", status: "Armed", lastRun: "4 days ago",
    rules: ["Rate-limit inbound > 1k req/s", "Redirect to scrubbing cluster", "Auto-scale NODE-01"],
    triggers: 3, color: "text-amber-600", bg: "bg-amber-50",
  },
  {
    id: 3, name: "Credential Rotation", status: "Armed", lastRun: "12 hrs ago",
    rules: ["Force password reset on breach", "Revoke active sessions", "Notify user via SecureMail"],
    triggers: 7, color: "text-emerald-600", bg: "bg-emerald-50",
  },
  {
    id: 4, name: "Node Auto-Quarantine", status: "Disarmed", lastRun: "Never",
    rules: ["Isolate node on 3 critical events", "Redirect traffic to backup", "Notify admin panel"],
    triggers: 0, color: "text-on-surface-variant", bg: "bg-surface-container-low",
  },
];

const queue = [
  { action: "Quarantine backup_svc", node: "NODE-02", urgency: "Critical", ts: "14:02:31" },
  { action: "Rotate credentials: uid 1003", node: "NODE-02", urgency: "High", ts: "13:52:00" },
  { action: "Block 203.0.113.42", node: "Global", urgency: "Critical", ts: "13:30:18" },
];

export default function AutomationPage() {
  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider">Automation</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Adaptive defense playbooks and response queue</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary">Telemetry Bus: Synced</span>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Playbooks */}
        <section className="col-span-8 space-y-4">
          <h2 className="text-base font-bold text-primary">Active Playbooks</h2>
          {playbooks.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${p.bg}`}>
                    <ShieldCheck className={`w-5 h-5 ${p.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{p.name}</p>
                    <p className="text-[10px] text-on-surface-variant">Last run: {p.lastRun} · {p.triggers} triggers total</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.status === "Armed" ? "bg-emerald-100 text-emerald-700" : "bg-surface-container-high text-on-surface-variant"}`}>
                    {p.status}
                  </span>
                  {/* Toggle */}
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${p.status === "Armed" ? "bg-primary" : "bg-outline-variant/30"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${p.status === "Armed" ? "left-5" : "left-0.5"}`} />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {p.rules.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Response Queue */}
        <section className="col-span-4 space-y-4">
          <h2 className="text-base font-bold text-primary">Response Queue</h2>
          <div className="space-y-3">
            {queue.map((q, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-outline-variant/10 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-semibold text-on-surface">{q.action}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${q.urgency === "Critical" ? "bg-error-container text-error" : "bg-amber-100 text-amber-700"}`}>{q.urgency}</span>
                </div>
                <p className="text-[10px] text-on-surface-variant mb-3">{q.node}</p>
                <div className="flex gap-2">
                  <button className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-primary text-white hover:bg-primary-container transition-colors">
                    Approve
                  </button>
                  <button className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors">
                    Dismiss
                  </button>
                </div>
                <p className="text-[9px] text-on-surface-variant/50 font-mono mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {q.ts}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
