"use client";

import { useUsage } from "@/lib/useUsage";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import OneAgentWorkspace from "@/components/OneAgentWorkspace";

export default function DashboardPage() {
const {
  weeklyAgentCalls,
  weeklyWorkflows,
} = useUsage();
  return (
    <div className="flex h-dvh w-full min-h-0 min-w-0 overflow-hidden bg-background">
      {/* Fixed sidebar */}
      <Sidebar
        weeklyAgentCalls={weeklyAgentCalls}
        weeklyWorkflows={weeklyWorkflows}
      />

      {/* Right side of application */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Fixed top bar */}
        <div className="shrink-0">
          <TopBar />
        </div>

        {/* Scrollable main content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <OneAgentWorkspace />
        </main>
      </div>
    </div>
  );
}