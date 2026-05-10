import { DashboardLayout } from "@/components/DashboardLayout";
import {
  AlertTriangle, Filter, Search, Clock, ChevronRight,
  Cpu, TriangleAlert, Info, CheckCircle
} from "lucide-react";

const events = [
  { id: 1, type: "Critical", title: "Access Violation", desc: "Unauthorized sudo attempt at SENTINEL-NODE-02 by user 'backup_svc'.", time: "14:02:31", pid: "4092", node: "NODE-02", color: "bg-error" },
  { id: 2, type: "Info", title: "Integrity Check", desc: "Daily hash verification completed for /etc/ssl/certs. 0 changes detected.", time: "13:58:12", pid: "1104", node: "NODE-01", color: "bg-emerald-500" },
  { id: 3, type: "Warning", title: "High CPU Usage", desc: "SENTINEL-NODE-02 CPU load exceeded 80% threshold for 5 consecutive minutes.", time: "13:55:04", pid: "SYS", node: "NODE-02", color: "bg-amber-500" },
  { id: 4, type: "Info", title: "Node Migration", desc: "Load balancing routine started. Transferring traffic from NODE-02 to NODE-01.", time: "13:45:00", pid: "SYS_EVENT", node: "NODE-01", color: "bg-primary-container" },
  { id: 5, type: "Critical", title: "Port Scan Detected", desc: "Inbound port scan from 203.0.113.42 targeting ports 22, 80, 443, 8080.", time: "13:30:18", pid: "4821", node: "NODE-03", color: "bg-error" },
  { id: 6, type: "Warning", title: "Certificate Expiry", desc: "TLS certificate for api.sentinel.internal expires in 14 days.", time: "13:10:00", pid: "SYS", node: "NODE-01", color: "bg-amber-500" },
  { id: 7, type: "Info", title: "Backup Completed", desc: "Encrypted snapshot of /var/log archived to secure vault. SHA256 verified.", time: "12:00:00", pid: "2201", node: "NODE-03", color: "bg-emerald-500" },
];

const badgeColor: Record<string, string> = {
  Critical: "bg-error-container text-error",
  Warning: "bg-amber-100 text-amber-700",
  Info: "bg-primary/5 text-primary",
};

export default function EventsPage() {
  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider">Live Event Stream</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Real-time prioritised system signals</p>
        </div>
        <span className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-error animate-pulse inline-block" />
          Live Feed Active
        </span>
      </header>

      {/* Summary Strip */}
      <div className="flex gap-3 mb-6">
        {[
          { label: "Total Today", value: "1,284", icon: Clock, color: "text-primary" },
          { label: "Critical", value: "14", icon: TriangleAlert, color: "text-error" },
          { label: "Warnings", value: "38", icon: AlertTriangle, color: "text-amber-600" },
          { label: "Info", value: "1,232", icon: Info, color: "text-emerald-600" },
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
          <input className="bg-transparent border-none outline-none text-sm w-full text-on-surface" placeholder="Filter events..." />
        </div>
        {["All", "Critical", "Warning", "Info"].map((f) => (
          <button key={f} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${f === "All" ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"}`}>
            {f}
          </button>
        ))}
        <button className="ml-auto flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
          <Filter className="w-4 h-4" /> Advanced Filter
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className="bg-white rounded-xl p-4 border border-outline-variant/10 flex items-start gap-4 hover:shadow-md transition-all group cursor-pointer">
            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${e.color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${badgeColor[e.type]}`}>{e.type}</span>
                <p className="text-sm font-semibold text-on-surface">{e.title}</p>
              </div>
              <p className="text-xs text-on-surface-variant truncate">{e.desc}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-on-surface-variant font-mono">{e.time}</p>
              <p className="text-[9px] text-primary/50 font-mono">{e.node} | PID: {e.pid}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-outline opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
