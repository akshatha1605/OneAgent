import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import OneAgentWorkspace from "@/components/OneAgentWorkspace";

export default function DashboardPage() {
  return (
    <div className="w-full min-h-screen flex bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 overflow-auto px-6 py-6">
          <OneAgentWorkspace />
        </main>
      </div>
    </div>
  );
}