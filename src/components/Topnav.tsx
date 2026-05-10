import { Search, ShieldAlert, Radio, Bell, Menu } from "lucide-react";

export function Topnav({ toggleSidebar }: { toggleSidebar: () => void }) {
  return (
    <nav className="fixed top-0 w-full flex justify-between items-center px-4 h-16 bg-surface/70 backdrop-blur-xl z-50 shadow-[0px_24px_48px_rgba(0,27,133,0.06)] border-b border-outline-variant/20">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-surface-container-high rounded-full transition-colors mr-2">
          <Menu className="w-6 h-6 text-primary" />
        </button>
        <span className="text-xl font-headline font-bold text-primary tracking-tighter">CADOC Sentinel</span>
        <div className="h-6 w-[1px] bg-outline-variant/30 mx-2"></div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center bg-surface-container-high px-4 py-1.5 rounded-full">
          <Search className="text-outline w-4 h-4 mr-2" />
          <input className="bg-transparent border-none outline-none focus:ring-0 text-sm w-48 font-body text-on-surface" placeholder="Search system logs..." type="text" />
        </div>
        <div className="flex gap-3 items-center">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/5 transition-transform active:scale-90">
            <Bell className="text-primary w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/5 transition-transform active:scale-90">
            <ShieldAlert className="text-primary w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/5 transition-transform active:scale-90">
            <Radio className="text-primary w-5 h-5" />
          </button>
          <button></button>
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container-high flex items-center justify-center">
            {/* Avatar placeholder */}
            <span className="text-primary font-bold text-xs">LA</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
