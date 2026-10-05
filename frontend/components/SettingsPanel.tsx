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
  Loader2,
} from "lucide-react";

import {
  getProfile,
  updateProfile as updateBackendProfile,
} from "@/lib/api";

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
  {
    name: "OpenAI",
    key: "sk-proj-••••••••••••7f2a",
  },
  {
    name: "Anthropic",
    key: "sk-ant-••••••••••••91bd",
  },
  {
    name: "Google Gemini",
    key: "AIza••••••••••••••c03e",
  },
  {
    name: "Tavily",
    key: "tvly-••••••••••••4e19",
  },
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
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF7ED]">
          <Icon
            size={17}
            className="text-[#D97706]"
            aria-hidden="true"
          />
        </div>

        <h3 className="text-[16px] font-semibold text-primary">
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
      className={`relative h-7 w-12 shrink-0 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 ${
        checked
          ? "border-accent bg-accent"
          : "border-[#D6D6D1] bg-[#E8E8E4]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked
            ? "translate-x-[23px]"
            : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPanel() {
  const [profile, setProfile] =
    useState<Profile>(initialProfile);

  const [notifications, setNotifications] =
    useState<NotificationSettings>(
      notificationDefaults
    );

  const [visibleKey, setVisibleKey] =
    useState<string | null>(null);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);

  const [error, setError] = useState("");

  /*
   * Load profile from the backend.
   * Notification preferences remain local for now because
   * the backend does not currently expose notification APIs.
   */
  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        setLoadingProfile(true);
        setError("");

        const backendProfile = await getProfile();

        if (cancelled) {
          return;
        }

        setProfile({
          name:
            backendProfile.name ||
            initialProfile.name,

          email:
            backendProfile.email ||
            initialProfile.email,
        });

        try {
          const storedNotifications =
            localStorage.getItem(
              "oneagent-notifications"
            );

          if (storedNotifications) {
            setNotifications(
              JSON.parse(storedNotifications)
            );
          }
        } catch {
          // Ignore malformed notification data.
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        /*
         * Keep the UI usable if the backend profile
         * endpoint is unavailable.
         */
        try {
          const storedProfile =
            localStorage.getItem(
              "oneagent-profile"
            );

          if (storedProfile) {
            setProfile(
              JSON.parse(storedProfile)
            );
          }
        } catch {
          // Ignore malformed local data.
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your profile."
        );
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    };

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateProfile = (
    field: keyof Profile,
    value: string
  ) => {
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

  const saveSettings = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError("");

      await updateBackendProfile({
        name: profile.name,
        email: profile.email,
      });

      localStorage.setItem(
        "oneagent-notifications",
        JSON.stringify(notifications)
      );

      /*
       * Keep a local copy as a fallback for development.
       */
      localStorage.setItem(
        "oneagent-profile",
        JSON.stringify(profile)
      );

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return "U";
    }

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${parts[
      parts.length - 1
    ][0]}`.toUpperCase();
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {/* Page state */}
      {error && (
        <div
          className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4"
          role="alert"
        >
          <p className="text-[14px] font-semibold text-[#B91C1C]">
            Settings update
          </p>

          <p className="mt-1 text-[13px] leading-5 text-[#B91C1C]/80">
            {error}
          </p>
        </div>
      )}

      {/* Profile */}
      <Section icon={User} title="Profile">
        {loadingProfile ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <div className="flex items-center gap-2.5 text-[13px] text-muted">
              <Loader2
                size={17}
                className="animate-spin"
              />
              Loading profile...
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-[16px] font-semibold text-white">
              {getInitials(profile.name)}
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-[12px] font-medium text-muted"
                >
                  Name
                </label>

                <input
                  id="profile-name"
                  value={profile.name}
                  onChange={(event) =>
                    updateProfile(
                      "name",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-[12px] font-medium text-muted"
                >
                  Email
                </label>

                <input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  onChange={(event) =>
                    updateProfile(
                      "email",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* API Keys */}
      <Section icon={KeyRound} title="API Keys">
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[12.5px] leading-5 text-amber-800">
            These are demo values. Real provider keys should
            be stored securely on the backend and must never
            be exposed in frontend source code.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {apiKeys.map((apiKey) => {
            const visible =
              visibleKey === apiKey.name;

            return (
              <div
                key={apiKey.name}
                className="flex items-center justify-between gap-4 rounded-xl border border-[#F0F0EE] bg-background px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-primary">
                    {apiKey.name}
                  </div>

                  <div className="mt-1 truncate font-mono text-[12px] text-faint">
                    {visible
                      ? apiKey.key.replace(
                          /•/g,
                          "x"
                        )
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
                      setVisibleKey(
                        visible
                          ? null
                          : apiKey.name
                      )
                    }
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-[#F0F0EE] hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {visible ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>

                  <button
                    type="button"
                    aria-label={`Rotate ${apiKey.name} API key`}
                    onClick={() => {
                      // Backend key rotation will be added later.
                    }}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-[#F0F0EE] hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <RotateCw size={15} />
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
          <NotificationRow
            title="Workflow completed"
            description="Notify when a workflow finishes successfully."
            checked={notifications.workflowCompleted}
            onChange={(value) =>
              updateNotification(
                "workflowCompleted",
                value
              )
            }
            label="Workflow completed notifications"
          />

          <NotificationRow
            title="Workflow failed"
            description="Notify when a workflow encounters an error."
            checked={notifications.workflowFailed}
            onChange={(value) =>
              updateNotification(
                "workflowFailed",
                value
              )
            }
            label="Workflow failed notifications"
          />

          <NotificationRow
            title="Weekly usage summary"
            description="Receive a summary of your agent usage."
            checked={notifications.weeklyUsage}
            onChange={(value) =>
              updateNotification(
                "weeklyUsage",
                value
              )
            }
            label="Weekly usage summary notifications"
          />

          <NotificationRow
            title="New agent connected"
            description="Notify when a new agent becomes available."
            checked={notifications.agentConnected}
            onChange={(value) =>
              updateNotification(
                "agentConnected",
                value
              )
            }
            label="New agent connected notifications"
          />
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end pb-2">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving || loadingProfile}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2
                size={15}
                className="animate-spin"
              />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check size={15} />
              Saved
            </>
          ) : (
            <>
              <Save size={15} />
              Save changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function NotificationRow({
  title,
  description,
  checked,
  onChange,
  label,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
      <div>
        <div className="text-[14px] font-medium text-primary">
          {title}
        </div>

        <div className="mt-1 text-[12px] leading-5 text-faint">
          {description}
        </div>
      </div>

      <Toggle
        label={label}
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
}