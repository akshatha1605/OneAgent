// app/agents/page.tsx
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AgentsGrid from "@/components/AgentsGrid";

export default function AgentsPage() {
  return (
    <div className="w-full min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto px-6 py-6 flex flex-col gap-6">
          <div>
            <h1 className="text-[19px] font-semibold text-primary tracking-tight">Agents</h1>
            <p className="text-[13px] text-muted mt-0.5">
              Models and tools OneAgent can call on.
            </p>
          </div>
          <AgentsGrid />
        </main>
      </div>
    </div>
  );
}
