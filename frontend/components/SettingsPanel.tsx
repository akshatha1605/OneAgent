"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  Bell,
  User,
  Eye,
  EyeOff,
  RotateCw,
  Save,
  Check,
} from "lucide-react";

type NotificationSettings = {
  workflowCompleted: boolean;
  workflowFailed: boolean;
  weeklyUsage: boolean;
  agentConnected: boolean;
};

type Profile = {
  name: string;
  email: string;
};

const initialProfile: Profile = {
  name: "User",
  email: "user@oneagent.dev",
};

const notificationDefaults: NotificationSettings = {
  workflowCompleted: true,
  workflowFailed: true,
  weeklyUsage: false,
  agentConnected: false,
};

const apiKeys = [
  { name: "OpenAI", key: "sk-proj-••••••••••••7f2a" },
  { name: "Anthropic", key: "sk-ant-••••••••••••91bd" },
  { name: "Google Gemini", key: "AIza••••••••••••••c03e" },
  { name: "Tavily", key: "tvly-••••••••••••4e19" },
];

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={15} className="text-accent" aria-hidden="true" />
        <h3 className="text-[13px] font-semibold text-primary">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 ${
        checked
          ? "border-accent bg-accent"
          : "border-[#D6D6D1] bg-[#E8E8E4]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[21px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPanel() {
  const [profile, setProfile] = useState<Profile>(initialProfile);

  const [notifications, setNotifications] =
    useState<NotificationSettings>(notificationDefaults);

  const [visibleKey, setVisibleKey] = useState<string | null>(null);

  const [saved, setSaved] = useState(false);

  /*
   * Local persistence for now.
   *
   * Later this can be replaced with:
   * GET  /api/users/profile
   * PUT  /api/users/profile
   *
   * and notification preferences can be stored by the backend.
   */
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("oneagent-profile");
      const storedNotifications = localStorage.getItem(
        "oneagent-notifications"
      );

      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }

      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
    } catch {
      // Ignore malformed local storage data.
    }
  }, []);

  const updateProfile = (field: keyof Profile, value: string) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  const updateNotification = (
    field: keyof NotificationSettings,
    value: boolean
  ) => {
    setNotifications((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(
        "oneagent-profile",
        JSON.stringify(profile)
      );

      localStorage.setItem(
        "oneagent-notifications",
        JSON.stringify(notifications)
      );

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch {
      setSaved(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "U";

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {/* Profile */}
      <Section icon={User} title="Profile">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-white">
            {getInitials(profile.name)}
          </div>

          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-1.5 block text-[11px] font-medium text-faint"
              >
                Name
              </label>

              <input
                id="profile-name"
                value={profile.name}
                onChange={(event) =>
                  updateProfile("name", event.target.value)
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="mb-1.5 block text-[11px] font-medium text-faint"
              >
                Email
              </label>

              <input
                id="profile-email"
                type="email"
                value={profile.email}
                onChange={(event) =>
                  updateProfile("email", event.target.value)
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* API Keys */}
      <Section icon={KeyRound} title="API Keys">
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="text-[11.5px] leading-relaxed text-amber-800">
            API keys are currently demo values. Real provider keys should be
            managed securely by the backend and should never be exposed in
            frontend source code.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {apiKeys.map((apiKey) => {
            const visible = visibleKey === apiKey.name;

            return (
              <div
                key={apiKey.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#F0F0EE] bg-background px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-primary">
                    {apiKey.name}
                  </div>

                  <div className="mt-0.5 truncate font-mono text-[11.5px] text-faint">
                    {visible
                      ? apiKey.key.replace(/•/g, "x")
                      : apiKey.key}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={
                      visible
                        ? `Hide ${apiKey.name} API key`
                        : `Show ${apiKey.name} API key`
                    }
                    onClick={() =>
                      setVisibleKey(visible ? null : apiKey.name)
                    }
                    className="rounded-md p-1.5 text-muted transition-colors hover:bg-[#F0F0EE] hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {visible ? (
                      <EyeOff size={14} />
                    ) : (
                      <Eye size={14} />
                    )}
                  </button>

                  <button
                    type="button"
                    aria-label={`Rotate ${apiKey.name} API key`}
                    onClick={() => {
                      // Backend API-key rotation will be implemented later.
                    }}
                    className="rounded-md p-1.5 text-muted transition-colors hover:bg-[#F0F0EE] hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <div className="divide-y divide-[#F0F0EE]">
          <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div>
              <div className="text-[12.5px] font-medium text-primary">
                Workflow completed
              </div>
              <div className="mt-0.5 text-[11px] text-faint">
                Notify when a workflow finishes successfully.
              </div>
            </div>

            <Toggle
              label="Workflow completed notifications"
              checked={notifications.workflowCompleted}
              onChange={(value) =>
                updateNotification("workflowCompleted", value)
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <div className="text-[12.5px] font-medium text-primary">
                Workflow failed
              </div>
              <div className="mt-0.5 text-[11px] text-faint">
                Notify when a workflow encounters an error.
              </div>
            </div>

            <Toggle
              label="Workflow failed notifications"
              checked={notifications.workflowFailed}
              onChange={(value) =>
                updateNotification("workflowFailed", value)
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <div className="text-[12.5px] font-medium text-primary">
                Weekly usage summary
              </div>
              <div className="mt-0.5 text-[11px] text-faint">
                Receive a summary of your agent usage.
              </div>
            </div>

            <Toggle
              label="Weekly usage summary notifications"
              checked={notifications.weeklyUsage}
              onChange={(value) =>
                updateNotification("weeklyUsage", value)
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
            <div>
              <div className="text-[12.5px] font-medium text-primary">
                New agent connected
              </div>
              <div className="mt-0.5 text-[11px] text-faint">
                Notify when a new agent becomes available.
              </div>
            </div>

            <Toggle
              label="New agent connected notifications"
              checked={notifications.agentConnected}
              onChange={(value) =>
                updateNotification("agentConnected", value)
              }
            />
          </div>
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveSettings}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[12.5px] font-medium text-white shadow-sm transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {saved ? (
            <>
              <Check size={14} />
              Saved
            </>
          ) : (
            <>
              <Save size={14} />
              Save changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}