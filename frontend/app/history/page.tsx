"use client";

import { useEffect, useState } from "react";
import { useUsage } from "@/lib/useUsage";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import HistoryList, {
  HistoryEntry,
} from "@/components/HistoryList";

import { getTasks, TaskHistoryItem } from "@/lib/api";

const TIME_ZONE = "Asia/Kolkata";

function parseTimestamp(dateString: string): Date {
  const value = dateString.trim();

  // ISO timestamps with Z or an explicit offset already identify
  // their timezone. Preserve that information.
  const hasTimezone =
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);

  // Backend timestamps without timezone information are assumed
  // to be UTC. This matches the usual FastAPI UTC timestamp format.
  const normalized = hasTimezone
    ? value
    : `${value}Z`;

  return new Date(normalized);
}

function getDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getHistoryGroup(
  dateString: string
): "Today" | "Yesterday" | "Earlier" {
  const date = parseTimestamp(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Earlier";
  }

  const now = new Date();

  const taskDateKey = getDateKey(date);
  const todayKey = getDateKey(now);

  if (taskDateKey === todayKey) {
    return "Today";
  }

  // Calculate yesterday using the calendar in IST.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );
  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );
  const day = Number(
    parts.find((part) => part.type === "day")?.value
  );

  // UTC calendar arithmetic avoids browser-local timezone errors.
  const yesterdayDate = new Date(
    Date.UTC(year, month - 1, day - 1)
  );

  const yesterdayKey = [
    yesterdayDate.getUTCFullYear(),
    String(yesterdayDate.getUTCMonth() + 1).padStart(2, "0"),
    String(yesterdayDate.getUTCDate()).padStart(2, "0"),
  ].join("-");

  if (taskDateKey === yesterdayKey) {
    return "Yesterday";
  }

  return "Earlier";
}

function formatTime(dateString: string): string {
  const date = parseTimestamp(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function mapTaskToHistoryEntry(
  task: TaskHistoryItem
): HistoryEntry {
  const agent =
    task.agent && task.agent !== "auto"
      ? task.agent
      : "Auto";

  return {
    id: task.id,
    title: task.task,
    agents: [agent],
    time: formatTime(task.created_at),
    outcome:
      task.status === "failed" ? "failed" : "success",
    group: getHistoryGroup(task.created_at),
    result:
      task.result ||
      task.error ||
      "No result available.",
  };
}

export default function HistoryPage() {
  const [tasks, setTasks] = useState<TaskHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  const {
    weeklyAgentCalls,
    weeklyWorkflows,
  } = useUsage();

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const response = await getTasks();

        setTasks(response.tasks || []);
        setHasMore(response.pagination?.has_more ?? false);
      } catch (error) {
        console.error("Failed to load history:", error);
        setTasks([]);
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load history."
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  async function loadMore() {
    if (loadingMore || !hasMore) {
      return;
    }

    try {
      setLoadingMore(true);
      const response = await getTasks({
        offset: tasks.length,
      });
      setTasks((current) => [...current, ...response.tasks]);
      setHasMore(response.pagination?.has_more ?? false);
    } catch (loadError) {
      console.error("Failed to load more history:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load more history."
      );
    } finally {
      setLoadingMore(false);
    }
  }

  const entries = tasks.map(mapTaskToHistoryEntry);

  return (
    <div className="flex h-dvh w-full min-h-0 overflow-hidden bg-background">
      <Sidebar
        weeklyAgentCalls={weeklyAgentCalls}
        weeklyWorkflows={weeklyWorkflows}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <TopBar />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-7">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight text-primary">
                History
              </h1>

              <p className="mt-1 text-sm text-faint">
                View your previous searches and task results.
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-border bg-card">
                <p className="text-sm text-faint">
                  Loading history...
                </p>
              </div>
            ) : error && tasks.length === 0 ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ) : (
              <HistoryList entries={entries} />
            )}

            {!loading && tasks.length > 0 && hasMore && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}

            {!loading && error && tasks.length > 0 && (
              <p className="mt-3 text-center text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
