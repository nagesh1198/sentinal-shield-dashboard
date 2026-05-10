import { Server, Grid, List, MoreVertical } from "lucide-react";

export function ManagedInfrastructure() {
  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-headline font-bold text-primary">Managed Infrastructure</h2>
        <div className="flex gap-1.5">
          <button className="p-1.5 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors">
            <Grid className="w-3.5 h-3.5 text-on-surface" />
          </button>
          <button className="p-1.5 bg-primary text-white rounded-lg">
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {/* Node Card 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10 flex items-center justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Server className="w-7 h-7 text-primary opacity-20" />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h4 className="font-headline font-semibold text-sm text-on-surface">SENTINEL-NODE-01</h4>
              <p className="text-[10px] text-on-surface-variant">Frankfurt, DE | 192.168.10.4</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-center">
            <div>
              <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">CPU</p>
              <p className="text-xs font-bold text-primary">12.4%</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">Memory</p>
              <p className="text-xs font-bold text-primary">4.2 / 16GB</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">Threats</p>
              <p className="text-xs font-bold text-on-surface">0 Detected</p>
            </div>
          </div>
          <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-primary/5 rounded-full">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Node Card 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10 flex items-center justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Server className="w-7 h-7 text-primary opacity-20" />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h4 className="font-headline font-semibold text-sm text-on-surface">SENTINEL-NODE-02</h4>
              <p className="text-[10px] text-on-surface-variant">Singapore, SG | 10.0.4.15</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-center">
            <div>
              <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">CPU</p>
              <p className="text-xs font-bold text-amber-600">68.1%</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">Memory</p>
              <p className="text-xs font-bold text-primary">14.9 / 16GB</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">Threats</p>
              <p className="text-xs font-bold text-error">2 Pending</p>
            </div>
          </div>
          <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-primary/5 rounded-full">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Node Card 3 */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10 flex items-center justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Server className="w-7 h-7 text-primary opacity-20" />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h4 className="font-headline font-semibold text-sm text-on-surface">SENTINEL-NODE-03</h4>
              <p className="text-[10px] text-on-surface-variant">New York, USA | 172.16.0.81</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-center">
            <div>
              <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">CPU</p>
              <p className="text-xs font-bold text-primary">5.2%</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">Memory</p>
              <p className="text-xs font-bold text-primary">2.1 / 16GB</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">Threats</p>
              <p className="text-xs font-bold text-on-surface">0 Detected</p>
            </div>
          </div>
          <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-primary/5 rounded-full">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
