import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import OneAgentWorkspace from "@/components/OneAgentWorkspace";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main className="flex-1 overflow-auto px-4 py-5 sm:px-6 sm:py-6">
          <OneAgentWorkspace />
        </main>
      </div>
    </div>
  );
}