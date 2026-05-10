import { AlertTriangle, ShieldCheck, Users, Activity } from "lucide-react";

export function SummaryBoxes() {
  return (
    <div className="flex gap-6 mb-6">

      {/* Card 1 - Critical Alerts */}
      <div className="stat-card flex-1">
        <div className="stat-card-inner rounded-2xl bg-white p-4 flex flex-col gap-1.5 border border-outline-variant/10">
          <div className="flex justify-between items-center mb-1">
            <AlertTriangle className="text-error bg-error-container/20 p-1.5 rounded-xl w-8 h-8" />
            <span className="text-[9px] font-bold text-error uppercase tracking-widest bg-error-container px-2 py-0.5 rounded-full">High Alert</span>
          </div>
          <p className="text-3xl font-headline font-bold text-on-surface">14</p>
          <p className="text-xs text-on-surface-variant font-medium">Critical Alerts</p>
        </div>
      </div>

      {/* Card 2 - Mitigated Incidents */}
      <div className="stat-card flex-1">
        <div className="stat-card-inner rounded-2xl bg-white p-4 flex flex-col gap-1.5 border border-outline-variant/10">
          <div className="flex justify-between items-center mb-1">
            <ShieldCheck className="text-primary bg-primary/5 p-1.5 rounded-xl w-8 h-8" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">Stable</span>
          </div>
          <p className="text-3xl font-headline font-bold text-on-surface">2,841</p>
          <p className="text-xs text-on-surface-variant font-medium">Mitigated Incidents</p>
        </div>
      </div>

      {/* Card 3 - Active Analysts */}
      <div className="stat-card flex-1">
        <div className="stat-card-inner rounded-2xl bg-white p-4 flex flex-col gap-1.5 border border-outline-variant/10">
          <div className="flex justify-between items-center mb-1">
            <Users className="text-primary bg-primary/5 p-1.5 rounded-xl w-8 h-8" />
          </div>
          <p className="text-3xl font-headline font-bold text-on-surface">12</p>
          <p className="text-xs text-on-surface-variant font-medium">Active Analysts</p>
        </div>
      </div>

      {/* Card 4 - Network Uptime */}
      <div className="stat-card flex-1">
        <div className="stat-card-inner rounded-2xl bg-primary p-4 flex flex-col gap-1.5 text-on-primary">
          <div className="flex justify-between items-center mb-1">
            <Activity className="text-on-primary-container bg-white/10 p-1.5 rounded-xl w-8 h-8" />
          </div>
          <p className="text-3xl font-headline font-bold">99.8%</p>
          <p className="text-xs text-on-primary-container font-medium">Network Uptime</p>
        </div>
      </div>

    </div>
  );
}
