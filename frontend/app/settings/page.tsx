import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import SettingsPanel from "@/components/SettingsPanel";

export default function SettingsPage() {
  return (
    <div className="flex h-dvh w-full min-h-0 overflow-hidden bg-background">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Right side */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Fixed top bar */}
        <div className="shrink-0">
          <TopBar />
        </div>

        {/* Scrollable content */}
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-7">
          <div className="flex flex-col gap-7">
            <div>
              <h1 className="text-[26px] font-semibold tracking-tight text-primary">
                Settings
              </h1>

              <p className="mt-1.5 text-[15px] leading-6 text-muted">
                Manage your profile, API keys, and notifications.
              </p>
            </div>

            <SettingsPanel />
          </div>
        </main>
      </div>
    </div>
  );
}