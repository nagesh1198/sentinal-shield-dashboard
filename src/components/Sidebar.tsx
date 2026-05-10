"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, BellRing, Radar, FileText,
  Server, Settings, Shield, HelpCircle, LogOut,
  Flame, Ghost, Footprints, SlidersHorizontal
} from "lucide-react";

const navMain = [
  { href: "/",               icon: LayoutDashboard,    label: "Dashboard" },
  { href: "/events",         icon: BellRing,           label: "Events" },
  { href: "/detections",     icon: Radar,              label: "Detections" },
  { href: "/logs",           icon: FileText,           label: "Logs" },
  { href: "/infrastructure", icon: Server,             label: "Infrastructure" },
  { href: "/automation",     icon: Settings,           label: "Automation" },
  { href: "/admin",          icon: Shield,             label: "Admin" },
  { href: "/settings",       icon: SlidersHorizontal,  label: "Settings" },
];

const navDeception = [
  { href: "/honeytokens",  icon: Flame,      label: "Honeytokens" },
  { href: "/decoys",       icon: Ghost,      label: "Decoys" },
  { href: "/breadcrumbs",  icon: Footprints, label: "Breadcrumbs" },
];

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const active = pathname === href;
    const base = `rounded-full py-3 flex items-center transition-all duration-300 ${isOpen ? "mx-2 px-6 gap-4" : "mx-4 px-0 justify-center w-12 h-12"}`;
    return active
      ? `${base} bg-primary text-white shadow-lg shadow-primary/20`
      : `${base} text-on-surface-variant hover:text-primary hover:bg-surface-container-high`;
  };

  const deceptionLinkClass = (href: string) => {
    const active = pathname === href;
    const base = `rounded-full py-3 flex items-center transition-all duration-300 ${isOpen ? "mx-2 px-6 gap-4" : "mx-4 px-0 justify-center w-12 h-12"}`;
    return active
      ? `${base} bg-amber-500 text-white shadow-lg shadow-amber-500/20`
      : `${base} text-on-surface-variant hover:text-amber-600 hover:bg-amber-50`;
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-surface-container-low flex flex-col py-8 z-40 mt-16 rounded-r-xl shadow-[4px_0px_24px_rgba(0,0,0,0.02)] transition-all duration-300 overflow-x-hidden overflow-y-auto ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className={`mb-6 whitespace-nowrap transition-all duration-300 ${isOpen ? "px-6 opacity-100" : "px-0 opacity-0 hidden"}`}>
        <p className="text-xs font-bold text-primary tracking-widest uppercase mb-1">Clinical Sentinel</p>
        <p className="text-[10px] text-on-surface-variant uppercase">Archival Access Level 4</p>
      </div>

      <nav className="flex-1 space-y-1">
        {/* Main Nav */}
        {navMain.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={linkClass(href)}>
            <Icon className="w-5 h-5 shrink-0" />
            {isOpen && <span className="font-medium text-sm whitespace-nowrap">{label}</span>}
          </Link>
        ))}

        {/* Deception Divider */}
        <div className={`my-3 transition-all duration-300 ${isOpen ? "mx-6" : "mx-4"}`}>
          <div className="border-t border-outline-variant/15" />
          {isOpen && (
            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-[0.15em] mt-3 mb-1 px-2">
              Deception Layer
            </p>
          )}
        </div>

        {/* Deception Nav */}
        {navDeception.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={deceptionLinkClass(href)}>
            <Icon className="w-5 h-5 shrink-0" />
            {isOpen && <span className="font-medium text-sm whitespace-nowrap">{label}</span>}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-1">
        <a className={`text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full py-2 flex items-center transition-all duration-300 ${isOpen ? "mx-2 px-6 gap-4" : "mx-4 px-0 justify-center w-12 h-12"}`} href="#">
          <HelpCircle className="w-5 h-5 shrink-0" />
          {isOpen && <span className="font-medium text-sm whitespace-nowrap">Support</span>}
        </a>
        <a className={`text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full py-2 flex items-center transition-all duration-300 ${isOpen ? "mx-2 px-6 gap-4" : "mx-4 px-0 justify-center w-12 h-12"}`} href="#">
          <LogOut className="w-5 h-5 shrink-0" />
          {isOpen && <span className="font-medium text-sm whitespace-nowrap">Logout</span>}
        </a>
      </div>
    </aside>
  );
}
