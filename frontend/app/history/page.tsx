"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import HistoryList, {
  type HistoryEntry,
} from "@/components/HistoryList";
import { getTasks, type TaskHistoryItem } from "@/lib/api";

function getHistoryGroup(
  createdAt?: string
): HistoryEntry["group"] {
  if (!createdAt) {
    return "Earlier";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Earlier";
  }

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(
    startOfYesterday.getDate() - 1
  );

  if (date >= startOfToday) {
    return "Today";
  }

  if (date >= startOfYesterday) {
    return "Yesterday";
  }

  return "Earlier";
}

function formatHistoryTime(
  createdAt?: string
): string {
  if (!createdAt) {
    return "Unknown time";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAgentName(
  agent?: string | null
): string {
  if (!agent) {
    return "OneAgent";
  }

  return agent
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function mapTaskToHistoryEntry(
  task: TaskHistoryItem
): HistoryEntry {
  return {
    id: task.id,

    title:
      task.task || "Untitled task",

    agents: task.agent
      ? [formatAgentName(task.agent)]
      : ["OneAgent"],

    time: formatHistoryTime(task.created_at),

    outcome:
      task.status === "failed"
        ? "failed"
        : "success",

    group: getHistoryGroup(task.created_at),
  };
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getTasks();

      const mappedEntries =
        response.tasks.map(
          mapTaskToHistoryEntry
        );

      setEntries(mappedEntries);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main className="flex flex-1 flex-col gap-7 overflow-auto px-6 py-7">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[26px] font-semibold tracking-tight text-primary">
                History
              </h1>

              <p className="mt-1.5 text-[15px] leading-6 text-muted">
                A log of everything OneAgent has run.
              </p>
            </div>

            {!loading && !error && entries.length > 0 && (
              <div className="rounded-lg border border-border bg-card px-3.5 py-2.5">
                <span className="text-[13px] font-medium text-primary">
                  {entries.length}{" "}
                  {entries.length === 1
                    ? "task"
                    : "tasks"}
                </span>
              </div>
            )}
          </div>

          {/* Loading */}
          {loading ? (
            <div
              className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border bg-card"
              role="status"
              aria-live="polite"
            >
              <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-[#D97706]" />

                <p className="text-[14px] font-medium text-primary">
                  Loading history...
                </p>

                <p className="mt-1 text-[12px] text-faint">
                  Fetching your recent OneAgent tasks.
                </p>
              </div>
            </div>
          ) : error ? (
            /* Error */
            <div
              className="flex flex-col gap-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <div>
                <p className="text-[15px] font-semibold text-[#B91C1C]">
                  Unable to load history
                </p>

                <p className="mt-1.5 text-[13px] leading-5 text-[#B91C1C]/80">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadHistory()}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#FECACA] bg-white px-3.5 py-2 text-[13px] font-medium text-[#B91C1C] transition-colors hover:bg-[#FFF7F7] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          ) : entries.length === 0 ? (
            /* Empty */
            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border bg-card">
              <div className="text-center">
                <p className="text-[15px] font-semibold text-primary">
                  No tasks yet
                </p>

                <p className="mt-1.5 text-[13px] text-faint">
                  Run a task from the dashboard and it will
                  appear here.
                </p>
              </div>
            </div>
          ) : (
            <HistoryList entries={entries} />
          )}
        </main>
      </div>
    </div>
  );
}