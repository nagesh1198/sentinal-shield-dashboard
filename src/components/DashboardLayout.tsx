"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Topnav } from "@/components/Topnav";
import { Sidebar } from "@/components/Sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <>
      <Topnav toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} />
      <main
        className={`mt-16 p-5 overflow-y-auto h-[calc(100vh-64px)] scroll-smooth bg-surface transition-all duration-300 ${
          isSidebarOpen ? "ml-64 w-[calc(100%-16rem)]" : "ml-20 w-[calc(100%-5rem)]"
        }`}
      >
        {children}
      </main>
    </>
  );
}
