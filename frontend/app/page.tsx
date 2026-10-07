import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import OneAgentWorkspace from "@/components/OneAgentWorkspace";

export default function DashboardPage() {
  return (
    <div className="flex h-dvh w-full min-h-0 min-w-0 overflow-hidden bg-background">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Right side of application */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Fixed top bar */}
        <div className="shrink-0">
          <TopBar />
        </div>

        {/* Workspace area */}
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <OneAgentWorkspace />
        </main>
      </div>
    </div>
  );
}