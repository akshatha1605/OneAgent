
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ApiKeyProvider,
  ApiKeyStatus,
  deleteApiKey,
  getApiKeyStatuses,
  saveApiKey,
} from "@/lib/api-keys";

const PROVIDERS: {
  id: ApiKeyProvider;
  name: string;
  description: string;
}[] = [
  { id: "openai", name: "OpenAI", description: "Connect OpenAI models." },
  { id: "gemini", name: "Google Gemini", description: "Connect Gemini models." },
  { id: "groq", name: "Groq", description: "Connect Groq-hosted models." },
  { id: "grok", name: "xAI Grok", description: "Connect xAI Grok models." },
  { id: "tavily", name: "Tavily", description: "Enable web search for research." },
];

type NotificationPreferences = {
  taskUpdates: boolean;
  workflowUpdates: boolean;
  productUpdates: boolean;
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  taskUpdates: true,
  workflowUpdates: true,
  productUpdates: false,
};

const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const primaryButtonClass =
  "rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600";

export default function SettingsPanel() {
  const [profile, setProfile] = useState({ email: "", name: "" });
  const [statuses, setStatuses] = useState<ApiKeyStatus[]>([]);
  const [keyInputs, setKeyInputs] = useState<
    Partial<Record<ApiKeyProvider, string>>
  >({});
  const [visibleKeys, setVisibleKeys] = useState<
    Partial<Record<ApiKeyProvider, boolean>>
  >({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [savingProvider, setSavingProvider] =
    useState<ApiKeyProvider | null>(null);
  const [removingProvider, setRemovingProvider] =
    useState<ApiKeyProvider | null>(null);
  const [notifications, setNotifications] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadStatuses = useCallback(async () => {
    setLoadingStatuses(true);
    try {
      const result = await getApiKeyStatuses();
      setStatuses(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load API key settings."
      );
    } finally {
      setLoadingStatuses(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (active && user) {
          setProfile({
            email: user.email ?? "",
            name:
              user.user_metadata?.full_name ??
              user.user_metadata?.name ??
              "",
          });
        }
      } catch {
        if (active) setProfile({ email: "", name: "" });
      }
    }

    void loadProfile();
    void loadStatuses();

    try {
      const stored = localStorage.getItem("oneagent-notifications");
      if (stored) {
        setNotifications({
          ...DEFAULT_NOTIFICATIONS,
          ...JSON.parse(stored),
        });
      }
    } catch {
      // Keep default preferences.
    }

    return () => {
      active = false;
    };
  }, [loadStatuses]);

  function isConfigured(provider: ApiKeyProvider) {
    return statuses.some(
      (item) => item.provider === provider && item.configured
    );
  }

  async function handleSave(provider: ApiKeyProvider) {
    const apiKey = keyInputs[provider]?.trim();

    if (!apiKey) {
      setError("Enter an API key before saving.");
      setSuccess("");
      return;
    }

    setSavingProvider(provider);
    setError("");
    setSuccess("");

    try {
      await saveApiKey(provider, apiKey);

      setKeyInputs((current) => ({ ...current, [provider]: "" }));
      setVisibleKeys((current) => ({ ...current, [provider]: false }));

      await loadStatuses();
      setSuccess(`${provider} API key saved successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save API key.");
    } finally {
      setSavingProvider(null);
    }
  }

  async function handleRemove(provider: ApiKeyProvider) {
    if (!window.confirm(`Remove the saved ${provider} API key?`)) return;

    setRemovingProvider(provider);
    setError("");
    setSuccess("");

    try {
      await deleteApiKey(provider);
      setKeyInputs((current) => ({ ...current, [provider]: "" }));
      await loadStatuses();
      setSuccess(`${provider} API key removed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove API key.");
    } finally {
      setRemovingProvider(null);
    }
  }

  function handleNotificationSave() {
    try {
      localStorage.setItem(
        "oneagent-notifications",
        JSON.stringify(notifications)
      );
      setNotificationMessage("Notification preferences saved.");
    } catch {
      setNotificationMessage("Unable to save notification preferences.");
    }
  }

  function updateNotification(
    key: keyof NotificationPreferences,
    value: boolean
  ) {
    setNotifications((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Profile */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your OneAgent account information.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Name
            </label>
            <input
              value={profile.name}
              readOnly
              placeholder="Name not set"
              className={fieldClass}
            />
            {!profile.name && (
              <p className="mt-1 text-xs text-muted-foreground">
                Your account does not currently have a display name.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              value={profile.email}
              readOnly
              placeholder="Email unavailable"
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      {/* API Keys */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground">
            API Key Management
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add and manage your provider API keys. Saved keys are not displayed
            again for security.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {loadingStatuses ? (
          <p className="py-6 text-sm text-muted-foreground">
            Loading API key settings...
          </p>
        ) : (
          <div className="space-y-5">
            {PROVIDERS.map((provider) => {
              const configured = isConfigured(provider.id);
              const saving = savingProvider === provider.id;
              const removing = removingProvider === provider.id;
              const hasInput = Boolean(keyInputs[provider.id]?.trim());

              return (
                <div key={provider.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {provider.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {provider.description}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        configured
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {configured ? "Configured" : "Not configured"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <input
                        type={visibleKeys[provider.id] ? "text" : "password"}
                        autoComplete="new-password"
                        value={keyInputs[provider.id] ?? ""}
                        onChange={(event) => {
                          setKeyInputs((current) => ({
                            ...current,
                            [provider.id]: event.target.value,
                          }));
                        }}
                        placeholder={
                          configured
                            ? "Enter a new key to replace the saved key"
                            : "Enter API key"
                        }
                        className={`${fieldClass} pr-16`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setVisibleKeys((current) => ({
                            ...current,
                            [provider.id]: !current[provider.id],
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        {visibleKeys[provider.id] ? "Hide" : "Show"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSave(provider.id)}
                      disabled={!hasInput || saving || removing}
                      className={primaryButtonClass}
                    >
                      {saving ? "Saving..." : configured ? "Replace" : "Save"}
                    </button>

                    {configured && (
                      <button
                        type="button"
                        onClick={() => handleRemove(provider.id)}
                        disabled={saving || removing}
                        className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {removing ? "Removing..." : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-5 text-xs text-muted-foreground">
          Your API keys should be encrypted on the backend and must never be
          shared publicly.
        </p>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose which OneAgent updates you want to enable.
          </p>
        </div>

        <div className="space-y-5">
          {(
            [
              ["taskUpdates", "Task updates", "Receive task execution updates."],
              ["workflowUpdates", "Workflow updates", "Receive workflow execution updates."],
              ["productUpdates", "Product updates", "Receive OneAgent announcements."],
            ] as const
          ).map(([key, label, description]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </div>
              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={(event) =>
                  updateNotification(key, event.target.checked)
                }
                className="h-4 w-4 accent-blue-600"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleNotificationSave}
            className={primaryButtonClass}
          >
            Save Preferences
          </button>
          {notificationMessage && (
            <p className="text-sm text-muted-foreground">
              {notificationMessage}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
