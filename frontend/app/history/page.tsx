// app/history/page.tsx
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import HistoryList from "@/components/HistoryList";

export default function HistoryPage() {
  return (
    <div className="w-full min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto px-6 py-6 flex flex-col gap-6">
          <div>
            <h1 className="text-[19px] font-semibold text-primary tracking-tight">History</h1>
            <p className="text-[13px] text-muted mt-0.5">
              A log of everything OneAgent has run.
            </p>
          </div>
          <HistoryList />
        </main>
      </div>
    </div>
  );
}
