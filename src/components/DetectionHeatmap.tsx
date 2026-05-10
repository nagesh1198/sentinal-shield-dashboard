export function DetectionHeatmap() {
  return (
    <div className="bg-tertiary rounded-xl p-5 text-white mt-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-headline font-bold text-base">Detection Risk Scoring</h3>
        <div className="text-[9px] font-bold uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">
          Global Heatmap
        </div>
      </div>
      <div className="grid grid-cols-12 gap-1.5 h-24">
        {/* Row 1 */}
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/10 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-primary-container rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/20 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-primary rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/10 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        {/* Row 2 */}
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/40 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/10 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-primary-container/80 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/5 rounded-sm hover:bg-white/20 transition-colors"></div>
        <div className="bg-white/10 rounded-sm hover:bg-white/20 transition-colors"></div>
      </div>
      <div className="mt-3 flex justify-between items-center text-[10px] text-white/50 font-medium">
        <span>Cluster: ASIA_PACIFIC_04</span>
        <span>Risk Index: 2.4 Low</span>
      </div>
    </div>
  );
}
