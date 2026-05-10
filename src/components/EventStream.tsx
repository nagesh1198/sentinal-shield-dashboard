export function EventStream() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_12px_32px_rgba(0,27,133,0.06)] flex flex-col border border-outline-variant/10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-headline font-bold text-primary">Live Event Stream</h2>
        <span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
      </div>
      <div className="space-y-3 overflow-y-auto pr-1">
        {/* Stream Item */}
        <div className="flex gap-3 items-start pb-3 border-b border-surface-container-high">
          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-error shrink-0"></div>
          <div>
            <p className="text-[10px] font-bold font-headline uppercase text-on-surface tracking-tight">Access Violation</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Unauthorized sudo attempt at SENTINEL-NODE-02 by user &apos;backup_svc&apos;.</p>
            <p className="text-[9px] text-primary/40 mt-1 font-mono">14:02:31 | PID: 4092</p>
          </div>
        </div>

        {/* Stream Item */}
        <div className="flex gap-3 items-start pb-3 border-b border-surface-container-high">
          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
          <div>
            <p className="text-[10px] font-bold font-headline uppercase text-on-surface tracking-tight">Integrity Check</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Daily hash verification completed for /etc/ssl/certs. 0 changes detected.</p>
            <p className="text-[9px] text-primary/40 mt-1 font-mono">13:58:12 | PID: 1104</p>
          </div>
        </div>

        {/* Stream Item */}
        <div className="flex gap-3 items-start pb-3 border-b border-surface-container-high">
          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></div>
          <div>
            <p className="text-[10px] font-bold font-headline uppercase text-on-surface tracking-tight">Node Migration</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Load balancing started. Transferring traffic from NODE-02 to NODE-01.</p>
            <p className="text-[9px] text-primary/40 mt-1 font-mono">13:45:00 | SYS_EVENT</p>
          </div>
        </div>
      </div>
    </div>
  );
}
