"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SummaryBoxes } from "@/components/SummaryBoxes";
import { ManagedInfrastructure } from "@/components/ManagedInfrastructure";
import { DetectionHeatmap } from "@/components/DetectionHeatmap";
import { EventStream } from "@/components/EventStream";
import { ForensicsVault } from "@/components/ForensicsVault";
import { AddServerModal } from "@/components/AddServerModal";
import { Download, Plus, Terminal } from "lucide-react";

export default function Home() {
  const [showAddServer, setShowAddServer] = useState(false);

  return (
    <DashboardLayout>
      <header className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-2xl font-bold text-primary -tracking-wider">Analyst Dashboard</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Operational Overview: Global Node Architecture</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-surface-container-high text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-surface-container-highest transition-colors flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button
            onClick={() => setShowAddServer(true)}
            className="bg-primary text-on-primary px-5 py-2 rounded-full text-sm font-medium hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add New Server
          </button>
        </div>
      </header>

      <SummaryBoxes />

      <div className="grid grid-cols-12 gap-6 items-start">
        <section className="col-span-8">
          <ManagedInfrastructure />
          <DetectionHeatmap />
        </section>
        <section className="col-span-4 flex flex-col gap-4">
          <EventStream />
          <ForensicsVault />
        </section>
      </div>

      <footer className="mt-6 pt-4 border-t border-outline-variant/15 flex justify-between items-center pb-4">
        <div className="flex gap-8">
          <div>
            <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">Total Datapoints</p>
            <p className="text-base font-bold text-primary">4.2M / day</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-0.5">Ingestion Lag</p>
            <p className="text-base font-bold text-primary">42ms</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-on-surface-variant text-[10px] font-medium">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Global Cluster Sync Active
          </span>
          <span className="h-3 w-[1px] bg-outline-variant/30" />
          <span>System Time: 14:05:22 UTC</span>
        </div>
      </footer>

      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50">
        <Terminal className="w-6 h-6" />
      </button>

      <AddServerModal isOpen={showAddServer} onClose={() => setShowAddServer(false)} />
    </DashboardLayout>
  );
}
