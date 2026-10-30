
"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  Bell,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Workflow,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getTasks, getWorkflows } from "@/lib/api";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  status: "completed" | "failed";
  createdAt: string;
  type: "task" | "workflow";
};

type TopBarProps = {
  userInitials?: string;
  hasNotifications?: boolean;
};

export default function TopBar({
  userInitials,
}: TopBarProps) {
  const [userName, setUserName] = useState("Loading...");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState("");

  const notificationRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleOutsideClick(event: MouseEvent) {
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }

  document.addEventListener("mousedown", handleOutsideClick);

  return () => {
    document.removeEventListener("mousedown", handleOutsideClick);
  };
}, []);
  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setNotificationError("");

      const [tasksResult, workflowsResult] = await Promise.allSettled([
        getTasks(),
        getWorkflows(),
      ]);

      const items: NotificationItem[] = [];

      if (tasksResult.status === "fulfilled") {
        for (const task of tasksResult.value.tasks ?? []) {
          const status = task.status?.toLowerCase();

          if (status === "completed" || status === "success") {
            items.push({
              id: `task-${task.id}`,
              title: "Task completed",
              description: task.task || "Your task was completed successfully.",
              status: "completed",
              createdAt: task.created_at,
              type: "task",
            });
          } else if (status === "failed" || status === "error") {
            items.push({
              id: `task-${task.id}`,
              title: "Task failed",
              description: task.task || "Your task execution failed.",
              status: "failed",
              createdAt: task.created_at,
              type: "task",
            });
          }
        }
      }

      if (workflowsResult.status === "fulfilled") {
        for (const workflow of workflowsResult.value.workflows ?? []) {
          const status = workflow.status?.toLowerCase();

          if (status === "completed") {
            items.push({
              id: `workflow-${workflow.workflow_id}`,
              title: "Workflow completed",
              description:
                workflow.task || "Your workflow completed successfully.",
              status: "completed",
              createdAt: workflow.updated_at || workflow.created_at || "",
              type: "workflow",
            });
          } else if (status === "failed") {
            items.push({
              id: `workflow-${workflow.workflow_id}`,
              title: "Workflow failed",
              description:
                workflow.task || "Your workflow execution failed.",
              status: "failed",
              createdAt: workflow.updated_at || workflow.created_at || "",
              type: "workflow",
            });
          }
        }
      }

      if (
        tasksResult.status === "rejected" &&
        workflowsResult.status === "rejected"
      ) {
        throw new Error("Unable to retrieve task and workflow history.");
      }

      items.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime() || 0;
        const dateB = new Date(b.createdAt).getTime() || 0;
        return dateB - dateA;
      });

      setNotifications(items);
    } catch (error) {
      console.error("Notification loading failed:", error);
      setNotificationError(
        "Unable to load notifications. Please try again."
      );
    } finally {
      setLoadingNotifications(false);
    }
  }, [userId]);

  // Load the authenticated user.
  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (active && user) {
          const metadataName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.display_name;

          const emailName = user.email?.split("@")[0] || "";

          setUserName(metadataName || emailName || "User");
          setUserEmail(user.email || "");
          setUserId(user.id);
        } else if (active) {
          setUserName("Guest");
        }
      } catch (error) {
        console.error("Unable to load user:", error);

        if (active) setUserName("User");
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  // Load saved read notification IDs.
  useEffect(() => {
    if (!userId) return;

    try {
      const stored = localStorage.getItem(
        `oneagent-read-notifications-${userId}`
      );

      setReadIds(stored ? JSON.parse(stored) : []);
    } catch {
      setReadIds([]);
    }
  }, [userId]);

  // Refresh notification data periodically.
  useEffect(() => {
    if (!userId) return;

    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [userId, loadNotifications]);

  const unreadCount = notifications.filter(
    (item) => !readIds.includes(item.id)
  ).length;

  function saveReadIds(ids: string[]) {
    setReadIds(ids);

    if (userId) {
      localStorage.setItem(
        `oneagent-read-notifications-${userId}`,
        JSON.stringify(ids)
      );
    }
  }

  function markAsRead(id: string) {
    if (!readIds.includes(id)) {
      saveReadIds([...readIds, id]);
    }
  }

  function markAllAsRead() {
    saveReadIds([
      ...new Set([...readIds, ...notifications.map((item) => item.id)]),
    ]);
  }

  const initials =
    userInitials ||
    userName
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") ||
    "U";

  function formatDate(value: string) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString([], {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  return (
    <header className="relative z-30 flex h-[68px] shrink-0 items-center justify-end border-b border-border bg-card px-6">
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-background hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <Bell size={19} strokeWidth={1.8} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-card">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {isOpen && (
            <div className="absolute right-0 top-12 z-50 w-[350px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Notifications
                  </h3>
                  <p className="text-xs text-gray-500">
                    {unreadCount} unread
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void loadNotifications()}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Refresh
                  </button>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                {loadingNotifications ? (
                  <p className="px-4 py-10 text-center text-sm text-gray-500">
                    Loading notifications...
                  </p>
                ) : notificationError ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-red-600">
                      {notificationError}
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadNotifications()}
                      className="mt-3 text-sm font-medium text-blue-600"
                    >
                      Try again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell
                      size={28}
                      className="mx-auto mb-3 text-gray-300"
                    />
                    <p className="text-sm font-medium text-gray-700">
                      You&apos;re all caught up!
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Completed and failed tasks will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isRead = readIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`flex gap-3 border-b border-gray-100 px-4 py-3 transition-colors ${
                          isRead ? "bg-white" : "bg-blue-50"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {item.status === "completed" ? (
                            item.type === "workflow" ? (
                              <Workflow
                                size={19}
                                className="text-green-600"
                              />
                            ) : (
                              <CheckCircle2
                                size={19}
                                className="text-green-600"
                              />
                            )
                          ) : (
                            <AlertCircle
                              size={19}
                              className="text-red-500"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {item.title}
                            </p>

                            {!isRead && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>

                          <p className="mt-1 break-words text-xs leading-5 text-gray-600">
                            {item.description}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="text-[10px] text-gray-400">
                              {formatDate(item.createdAt)}
                            </p>

                            {!isRead && (
                              <button
                                type="button"
                                onClick={() => markAsRead(item.id)}
                                className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800"
                              >
                                <Check size={12} />
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-gray-200 px-4 py-2">
                <p className="text-center text-[10px] text-gray-400">
                  Updates automatically every 30 seconds
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-1 h-7 w-px bg-border" />

        {/* User */}
        <button
          type="button"
          aria-label="User account"
          className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[12px] font-semibold tracking-wide text-white">
            {initials.slice(0, 2).toUpperCase()}
          </span>

          <div className="hidden text-left sm:block">
            <p className="max-w-[160px] truncate text-[13px] font-semibold leading-4 text-primary">
              {userName}
            </p>

            <p className="max-w-[160px] truncate text-[11px] leading-4 text-faint">
              {userEmail || "OneAgent"}
            </p>
          </div>

          <ChevronDown
            size={15}
            className="hidden text-faint transition-transform group-hover:text-primary sm:block"
          />
        </button>
      </div>
    </header>
  );
}
