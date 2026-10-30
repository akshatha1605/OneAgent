
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MarkdownRenderer from "@/components/MarkdownRenderer";

import { getTask, TaskHistoryItem } from "@/lib/api";

const TIME_ZONE = "Asia/Kolkata";

function formatTimestamp(dateString: string): string {
  if (!dateString) {
    return "Unknown time";
  }

  const value = dateString.trim();

  // Assume timestamps without timezone information are UTC.
  const hasTimezone =
    /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);

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

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id;

  const [task, setTask] =
    useState<TaskHistoryItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTask() {
      try {
        setLoading(true);
        setError(null);
        setTask(null);

        const response = await getTask(String(taskId));

        if (cancelled) return;

        setTask(response);
      } catch (err) {
        console.error("Failed to load history item:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this result."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (taskId) {
      loadTask();
    }

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const isCompleted = task?.status === "completed";

  return (
    <div className="flex h-dvh w-full min-h-0 overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <TopBar />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-7">
          <div className="mx-auto w-full max-w-4xl">

            {/* Back navigation */}
            <Link
              href="/history"
              className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Link>

            {/* Loading state */}
            {loading && (
              <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Loading result...
                </p>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
                <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />

                <p className="text-sm font-medium text-destructive">
                  {error}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Task ID: {taskId}
                </p>

                <Link
                  href="/history"
                  className="mt-5 inline-block text-sm font-medium text-primary underline"
                >
                  Return to History
                </Link>
              </div>
            )}

            {/* Task details */}
            {!loading && !error && task && (
              <article>

                {/* Task header */}
                <div className="mb-6">
                  <div className="flex items-start gap-3">

                    {isCompleted ? (
                      <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="mt-1 h-6 w-6 shrink-0 text-destructive" />
                    )}

                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {task.task || "Untitled task"}
                      </h1>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">

                        <span>
                          {task.agent && task.agent !== "auto"
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

                        <span>
                          {formatTimestamp(task.created_at)}
                        </span>

                        <span>•</span>

                        <span
                          className={
                            isCompleted
                              ? "text-emerald-600"
                              : "text-destructive"
                          }
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Answer section */}
                <div className="rounded-2xl border border-border bg-card">

                  <div className="border-b border-border px-6 py-4">
                    <h2 className="text-sm font-semibold text-foreground">
                      {isCompleted ? "Answer" : "Task Details"}
                    </h2>
                  </div>

                  <div className="px-6 py-6">
                    {task.result ? (
                      <MarkdownRenderer
                        content={task.result}
                      />
                    ) : task.error ? (
                      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                        <h3 className="mb-2 text-sm font-semibold text-destructive">
                          Task failed
                        </h3>

                        <p className="whitespace-pre-wrap text-sm text-destructive">
                          {task.error}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No result is available for this task.
                      </p>
                    )}
                  </div>
                </div>

                {/* Task metadata */}
                <div className="mt-5 rounded-2xl border border-border bg-card p-5">
                  <h2 className="mb-4 text-sm font-semibold text-foreground">
                    Task Information
                  </h2>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Task ID
                      </p>
                      <p className="mt-1 break-all text-sm text-foreground">
                        {task.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Status
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {task.status}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Agent
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {task.agent || "Auto"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Model
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {task.model || "Not specified"}
                      </p>
                    </div>

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
