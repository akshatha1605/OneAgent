"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MarkdownRenderer from "@/components/MarkdownRenderer";

import { getTasks, TaskHistoryItem } from "@/lib/api";

type HistoryDetailPageProps = {
  params: {
    id: string;
  };
};

const TIME_ZONE = "Asia/Kolkata";

/**
 * Format a backend timestamp in Indian Standard Time.
 * Timestamps with an explicit timezone retain that timezone information.
 * Timestamps without a timezone are assumed to be UTC.
 */
function formatTimestamp(dateString: string): string {
  if (!dateString) {
    return "Unknown time";
  }

  const value = dateString.trim();

  const hasTimezone =
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);

  const date = new Date(
    hasTimezone ? value : `${value}Z`
  );

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function HistoryDetailPage({
  params,
}: HistoryDetailPageProps) {
  const [task, setTask] =
    useState<TaskHistoryItem | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadTask() {
      try {
        setLoading(true);
        setError(null);

        const response = await getTasks();

        const found = response.tasks.find(
          (item) => item.id === params.id
        );

        if (!found) {
          setError("History item not found.");
          return;
        }

        setTask(found);
      } catch (err) {
        console.error(
          "Failed to load history item:",
          err
        );

        setError("Unable to load this result.");
      } finally {
        setLoading(false);
      }
    }

    loadTask();
  }, [params.id]);

  return (
    <div className="flex h-dvh w-full min-h-0 overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Right side */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0">
          <TopBar />
        </div>

        {/* Scrollable content */}
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-7">
          <div className="mx-auto w-full max-w-4xl">
            {/* Back */}
            <Link
              href="/history"
              className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Link>

            {/* Loading */}
            {loading && (
              <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Loading result...
                </p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
                <p className="text-sm text-destructive">
                  {error}
                </p>
              </div>
            )}

            {/* Task details */}
            {!loading && !error && task && (
              <article>
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-start gap-3">
                    {task.status === "completed" ? (
                      <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="mt-1 h-6 w-6 shrink-0 text-destructive" />
                    )}

                    <div className="min-w-0">
                      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {task.task}
                      </h1>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {task.agent &&
                          task.agent !== "auto"
                            ? task.agent
                            : "Auto"}
                        </span>

                        {task.model && (
                          <>
                            <span>•</span>
                            <span>{task.model}</span>
                          </>
                        )}

                        <span>•</span>

                        {/* Corrected IST timestamp */}
                        <span>
                          {formatTimestamp(
                            task.created_at
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Result */}
                <div className="rounded-2xl border border-border bg-card">
                  <div className="border-b border-border px-6 py-4">
                    <h2 className="text-sm font-semibold text-foreground">
                      Answer
                    </h2>
                  </div>

                  <div className="px-6 py-6">
                    {task.result ? (
                      <MarkdownRenderer
                        content={task.result}
                      />
                    ) : task.error ? (
                      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                        {task.error}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No result available.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}