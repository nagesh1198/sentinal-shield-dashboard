import { DashboardLayout } from "@/components/DashboardLayout";
import { ShieldAlert, TrendingUp, Globe, ChevronRight } from "lucide-react";

const anomalies = [
  { id: 1, name: "Brute Force — SSH", confidence: 94, origin: "203.0.113.42", mitre: "T1110", severity: "Critical", delta: "+12 signals/hr" },
  { id: 2, name: "Lateral Movement", confidence: 78, origin: "10.0.4.15 (internal)", mitre: "T1021", severity: "High", delta: "+5 signals/hr" },
  { id: 3, name: "Data Exfiltration Attempt", confidence: 61, origin: "198.51.100.8", mitre: "T1041", severity: "Medium", delta: "+2 signals/hr" },
  { id: 4, name: "Privilege Escalation", confidence: 88, origin: "NODE-02 / uid 1003", mitre: "T1068", severity: "Critical", delta: "+8 signals/hr" },
];

const heatRows = 3;
const heatCols = 16;
const intensities = ["bg-white/5","bg-white/10","bg-white/20","bg-white/30","bg-primary-container/60","bg-primary","bg-white/40"];

function randomIntensity(r: number, c: number) {
  const seed = (r * 7 + c * 13) % intensities.length;
  return intensities[seed];
}

export default function DetectionsPage() {
  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider">Threat Detection</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Heuristic analysis & confidence scoring across global nodes</p>
        </div>
      </header>

      {/* Global Heatmap */}
      <div className="bg-tertiary rounded-2xl p-6 mb-6 text-white shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-bold text-lg">Detection Risk Scoring</h2>
            <p className="text-xs text-white/50 mt-0.5">Live signal density across all clusters</p>
          </div>
          <div className="flex gap-3 items-center text-xs text-white/50">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-white/10 inline-block" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-white/30 inline-block" /> Med</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary inline-block" /> High</span>
          </div>
        </div>
        <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${heatCols}, 1fr)` }}>
          {Array.from({ length: heatRows * heatCols }).map((_, i) => {
            const r = Math.floor(i / heatCols), c = i % heatCols;
            return <div key={i} className={`h-8 rounded-sm hover:opacity-80 transition-opacity cursor-pointer ${randomIntensity(r, c)}`} />;
          })}
        </div>
        <div className="mt-3 flex justify-between text-[10px] text-white/40 font-mono">
          <span>CLUSTER: ASIA_PACIFIC_04</span><span>Risk Index: 2.4 — Low</span>
        </div>
      </div>

      {/* Detection Velocity + Anomalies */}
      <div className="grid grid-cols-12 gap-6">
        {/* Anomaly Cards */}
        <section className="col-span-8 space-y-3">
          <h2 className="text-base font-bold text-primary mb-3">Active Anomalies</h2>
          {anomalies.map((a) => (
            <div key={a.id} className="bg-white rounded-xl p-4 border border-outline-variant/10 flex items-center gap-5 hover:shadow-md transition-all group cursor-pointer">
              <ShieldAlert className={`w-8 h-8 shrink-0 ${a.severity === "Critical" ? "text-error" : a.severity === "High" ? "text-amber-600" : "text-primary"}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-on-surface">{a.name}</p>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${a.severity === "Critical" ? "bg-error-container text-error" : a.severity === "High" ? "bg-amber-100 text-amber-700" : "bg-primary/5 text-primary"}`}>{a.severity}</span>
                </div>
                <p className="text-[10px] text-on-surface-variant">Origin: {a.origin} &nbsp;|&nbsp; MITRE: {a.mitre}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-on-surface">{a.confidence}%</p>
                <p className="text-[9px] text-on-surface-variant">Confidence</p>
              </div>
              <div className="text-right min-w-[90px]">
                <p className="text-xs font-semibold text-error">{a.delta}</p>
                <p className="text-[9px] text-on-surface-variant">Velocity</p>
              </div>
              <ChevronRight className="w-4 h-4 text-outline opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          ))}
        </section>

        {/* Signal Velocity Panel */}
        <section className="col-span-4">
          <h2 className="text-base font-bold text-primary mb-3">Signal Velocity</h2>
          <div className="bg-white rounded-xl p-4 border border-outline-variant/10 space-y-3">
            {[["00:00–04:00","EMEA","bg-primary/20","text-primary","32"],["04:00–08:00","APAC","bg-error/20","text-error","87"],["08:00–12:00","AMER","bg-amber-100","text-amber-600","54"],["12:00–16:00","EMEA","bg-primary/30","text-primary","41"],["16:00–20:00","APAC","bg-error/10","text-error","19"],["20:00–00:00","AMER","bg-primary/10","text-primary","12"]].map(([time, region, bg, text, count]) => (
              <div key={time} className="flex items-center gap-3">
                <div className="text-[9px] text-on-surface-variant font-mono w-24 shrink-0">{time}</div>
                <div className="flex-1 h-5 bg-surface-container-low rounded-full overflow-hidden">
                  <div className={`h-full ${bg} rounded-full`} style={{ width: `${(parseInt(count)/90)*100}%` }} />
                </div>
                <span className={`text-xs font-bold ${text} w-6 text-right`}>{count}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-outline-variant/10 flex justify-between text-[10px] text-on-surface-variant">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Global regions</span>
              <span className="flex items-center gap-1 text-error"><TrendingUp className="w-3 h-3" /> +18% vs yesterday</span>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
