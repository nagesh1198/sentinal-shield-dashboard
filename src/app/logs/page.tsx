import { DashboardLayout } from "@/components/DashboardLayout";
import { Play, ShieldCheck, Lock, FileText, Link2, AlertTriangle } from "lucide-react";

const logs = [
  { ts: "14:02:31", level: "CRIT", source: "auth.log", msg: "Failed sudo: user backup_svc on NODE-02" },
  { ts: "13:58:12", level: "INFO", source: "integrity.log", msg: "Hash check passed /etc/ssl/certs — 0 delta" },
  { ts: "13:55:04", level: "WARN", source: "system.log", msg: "CPU threshold breach NODE-02 > 80%" },
  { ts: "13:45:00", level: "INFO", source: "lb.log", msg: "Load balancer: redirect NODE-02 → NODE-01" },
  { ts: "13:30:18", level: "CRIT", source: "network.log", msg: "Port scan 203.0.113.42 → NODE-03 :22,:80,:443" },
  { ts: "13:10:00", level: "WARN", source: "cert.log", msg: "Certificate api.sentinel.internal expires in 14d" },
  { ts: "12:00:00", level: "INFO", source: "backup.log", msg: "Snapshot /var/log archived — SHA256 OK" },
];

const levelStyle: Record<string, string> = {
  CRIT: "text-error bg-error-container",
  WARN: "text-amber-700 bg-amber-100",
  INFO: "text-emerald-700 bg-emerald-100",
};

export default function LogsPage() {
  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider">Forensic Logs</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Immutable event repository — cryptographically verified</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700">Chain Integrity: Verified</span>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* SQL Query Interface */}
        <section className="col-span-8 space-y-4">
          <div className="bg-[#0e1117] rounded-2xl p-5 border border-outline-variant/10 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-error/60" />
                <span className="w-3 h-3 rounded-full bg-amber-400/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/60" />
              </div>
              <span className="text-[10px] text-white/30 font-mono">sentinel_query.sql</span>
            </div>
            <pre className="text-sm font-mono leading-6 select-all">
              <span className="text-blue-400">SELECT</span>
              <span className="text-white"> timestamp, level, source, message</span>
              {"\n"}
              <span className="text-blue-400">FROM</span>
              <span className="text-white"> sentinel_logs</span>
              {"\n"}
              <span className="text-blue-400">WHERE</span>
              <span className="text-white"> level </span>
              <span className="text-amber-400">IN</span>
              <span className="text-white"> (</span>
              <span className="text-emerald-400">&apos;CRIT&apos;</span>
              <span className="text-white">, </span>
              <span className="text-emerald-400">&apos;WARN&apos;</span>
              <span className="text-white">)</span>
              {"\n"}
              <span className="text-blue-400">AND</span>
              <span className="text-white"> timestamp &gt; NOW() - INTERVAL </span>
              <span className="text-emerald-400">24 HOURS</span>
              {"\n"}
              <span className="text-blue-400">ORDER BY</span>
              <span className="text-white"> timestamp </span>
              <span className="text-blue-400">DESC</span>
              <span className="text-white">;</span>
            </pre>
            <div className="mt-4 flex justify-end">
              <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-primary-container transition-colors shadow-lg shadow-primary/20">
                <Play className="w-3.5 h-3.5" /> Run Query
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant/10 flex justify-between items-center">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Query Results — {logs.length} rows</span>
              <span className="text-[10px] text-on-surface-variant font-mono">Executed in 2ms</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-container-low">
                  <tr>
                    {["Timestamp","Level","Source","Message"].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={i} className="border-t border-outline-variant/5 hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-on-surface-variant whitespace-nowrap">{log.ts}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${levelStyle[log.level]}`}>{log.level}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-on-surface-variant">{log.source}</td>
                      <td className="px-4 py-2.5 text-on-surface">{log.msg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Archive Vault + Chain Integrity */}
        <section className="col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="text-primary w-4 h-4" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Merkle Chain Integrity</h3>
            </div>
            <div className="space-y-2">
              {["Block #4091 → Verified", "Block #4090 → Verified", "Block #4089 → Verified", "Block #4088 → Verified"].map((b, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5">
                  <span className="font-mono text-on-surface-variant">{b.split(" → ")[0]}</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-outline-variant/10 flex justify-between text-[10px] text-on-surface-variant">
              <span>4,091 blocks total</span>
              <span className="text-emerald-600 font-bold">100% intact</span>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="text-primary w-4 h-4" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Archive Vault</h3>
            </div>
            <div className="space-y-2">
              {[
                { name: "AUDIT_LOG_230921.tar.gz", size: "12.4 MB", verified: true },
                { name: "TCP_DUMP_02.pcap", size: "84.1 MB", verified: false },
                { name: "SYSLOG_230920.tar.gz", size: "9.7 MB", verified: true },
              ].map((f) => (
                <div key={f.name} className="bg-white p-2.5 rounded-xl flex justify-between items-center border border-outline-variant/5 shadow-sm">
                  <div>
                    <p className="text-[10px] font-mono text-on-surface">{f.name}</p>
                    <p className="text-[9px] text-on-surface-variant">{f.size}</p>
                  </div>
                  {f.verified ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Lock className="w-3.5 h-3.5 text-on-surface-variant" />}
                </div>
              ))}
            </div>
            <button className="w-full mt-3 py-1.5 border border-primary/20 text-primary text-[10px] font-bold rounded-xl hover:bg-primary/5 transition-colors">
              View Full Archive
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
