"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import HistoryList, {
  type HistoryEntry,
} from "@/components/HistoryList";
import { getWorkflows } from "@/lib/api";

function getHistoryGroup(createdAt?: string): HistoryEntry["group"] {
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
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    return "Today";
  }

  if (date >= startOfYesterday) {
    return "Yesterday";
  }

  return "Earlier";
}

function formatHistoryTime(createdAt?: string): string {
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

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const workflows = await getWorkflows();

        if (cancelled) {
          return;
        }

        const mappedEntries: HistoryEntry[] = workflows.map(
          (workflow, index) => ({
            id: workflow.id ?? `workflow-${index}`,
            title: workflow.title ?? "Untitled workflow",
            agents: workflow.agents ?? [],
            time: formatHistoryTime(workflow.createdAt),
            outcome:
              workflow.status === "failed"
                ? "failed"
                : "success",
            group: getHistoryGroup(workflow.createdAt),
          })
        );

        setEntries(mappedEntries);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load history."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main className="flex flex-1 flex-col gap-6 overflow-auto px-6 py-6">
          <div>
            <h1 className="text-[19px] font-semibold tracking-tight text-primary">
              History
            </h1>

            <p className="mt-0.5 text-[13px] text-muted">
              A log of everything OneAgent has run.
            </p>
          </div>

          {loading ? (
            <div
              className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-border bg-card"
              role="status"
              aria-live="polite"
            >
              <p className="text-[13px] text-faint">
                Loading history...
              </p>
            </div>
          ) : error ? (
            <div
              className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4"
              role="alert"
            >
              <p className="text-[13px] font-medium text-[#B91C1C]">
                Unable to load history
              </p>

              <p className="mt-1 text-[12px] text-[#B91C1C]/80">
                {error}
              </p>
            </div>
          ) : (
            <HistoryList entries={entries} />
          )}
        </main>
      </div>
    </div>
  );
}