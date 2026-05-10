import { History, ShieldCheck, Lock } from "lucide-react";

export function ForensicsVault() {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10">
      <div className="flex items-center gap-2 mb-3">
        <History className="text-primary w-3.5 h-3.5" />
        <h3 className="text-[9px] font-bold uppercase tracking-widest text-primary">Forensics Vault</h3>
      </div>
      <div className="space-y-1.5">
        <div className="bg-white p-2.5 rounded-lg flex justify-between items-center shadow-sm border border-outline-variant/5">
          <span className="text-[10px] font-mono text-on-surface">AUDIT_LOG_230921.tar.gz</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="bg-white p-2.5 rounded-lg flex justify-between items-center shadow-sm border border-outline-variant/5">
          <span className="text-[10px] font-mono text-on-surface">TCP_DUMP_02.pcap</span>
          <Lock className="w-3.5 h-3.5 text-on-surface-variant" />
        </div>
      </div>
      <button className="w-full mt-3 py-1.5 border border-primary/20 text-primary text-[10px] font-bold rounded-lg hover:bg-primary/5 transition-colors">
        View Full Archive
      </button>
    </div>
  );
}
