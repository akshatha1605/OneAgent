"use client";

import { useEffect, useState } from "react";
import { useUsage } from "@/lib/useUsage";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import HistoryList, {
  HistoryEntry,
} from "@/components/HistoryList";

import { getTasks, TaskHistoryItem } from "@/lib/api";

function getHistoryGroup(
  dateString: string
): "Today" | "Yesterday" | "Earlier" {
  const date = new Date(dateString);
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) {
    return "Today";
  }

  if (date >= yesterday) {
    return "Yesterday";
  }

  return "Earlier";
}

function formatTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
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
      task.status === "failed"
        ? "failed"
        : "success",

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

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);

        const response = await getTasks();

        console.log("History tasks:", response.tasks);

        setTasks(response.tasks || []);
      } catch (error) {
        console.error(
          "Failed to load history:",
          error
        );

        setTasks([]);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);
const {
  weeklyAgentCalls,
  weeklyWorkflows,
} = useUsage();
  const entries = tasks.map(mapTaskToHistoryEntry);

  return (
    <div className="flex h-dvh w-full min-h-0 overflow-hidden bg-background">
      {/* Sidebar */}
<Sidebar
  weeklyAgentCalls={weeklyAgentCalls}
  weeklyWorkflows={weeklyWorkflows}
/>
      {/* Right side */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0">
          <TopBar />
        </div>

        {/* Scrollable content */}
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-7">
          <div className="mx-auto w-full max-w-5xl">

            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight text-primary">
                History
              </h1>

              <p className="mt-1 text-sm text-faint">
                View your previous searches and task results.
              </p>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-border bg-card">
                <p className="text-sm text-faint">
                  Loading history...
                </p>
              </div>
            ) : (
              <HistoryList entries={entries} />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}