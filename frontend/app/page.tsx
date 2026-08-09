import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import QuickActions from "@/components/QuickActions";
import PipelineVisualizer from "@/components/PipelineVisualizer";
import RunningAgents from "@/components/RunningAgents";
import RecentWorkflows from "@/components/RecentWorkflows";
import ConnectedAgents from "@/components/ConnectedAgents";
import TodaysTasks from "@/components/TodaysTasks";

export default function DashboardPage() {
  return (
    <div className="w-full min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto px-6 py-6 flex flex-col gap-6">
          <div>
            <h1 className="text-[19px] font-semibold text-primary tracking-tight">
              Good afternoon, Arjun
            </h1>
            <p className="text-[13px] text-muted mt-0.5">
              Tell OneAgent what you need &mdash; it&rsquo;ll pick the right agents and run the workflow.
            </p>
          </div>

          <QuickActions />
          <PipelineVisualizer />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 flex flex-col gap-5">
              <RecentWorkflows />
              <ConnectedAgents />
            </div>
            <div className="flex flex-col gap-5">
              <RunningAgents />
              <TodaysTasks />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
