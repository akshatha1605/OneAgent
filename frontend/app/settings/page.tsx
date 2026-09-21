import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import SettingsPanel from "@/components/SettingsPanel";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main className="flex flex-1 flex-col gap-6 overflow-auto px-6 py-6">
          <div>
            <h1 className="text-[19px] font-semibold tracking-tight text-primary">
              Settings
            </h1>

            <p className="mt-0.5 text-[13px] text-muted">
              Manage your profile, API keys, and notifications.
            </p>
          </div>

          <SettingsPanel />
        </main>
      </div>
    </div>
  );
}