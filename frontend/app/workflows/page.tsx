"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  Workflow as WorkflowIcon,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import WorkflowsList, {
  type Workflow,
} from "@/components/WorkflowsList";
import { getWorkflows } from "@/lib/api";

function formatWorkflowTime(createdAt?: string): string {
  if (!createdAt) {
    return "Unknown";
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

function normalizeStatus(
  status?: string
): Workflow["status"] {
  switch (status) {
    case "running":
      return "running";

    case "failed":
      return "failed";

    case "completed":
    case "done":
      return "done";

    case "queued":
    case "pending":
    default:
      return "queued";
  }
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getWorkflows();

      const mappedWorkflows: Workflow[] = data.workflows.map(
        (workflow) => ({
          id: workflow.workflow_id,

          title:
            workflow.task?.trim() ||
            "Untitled workflow",

          description:
            workflow.task?.trim() ||
            "No description provided.",

          status: normalizeStatus(
            workflow.status
          ),

          agents: ["OneAgent"],

          createdAt: formatWorkflowTime(
            workflow.created_at
          ),

          duration: "—",

          progress:
            workflow.status === "running"
              ? 50
              : workflow.status === "completed" ||
                  workflow.status === "done"
                ? 100
                : undefined,
        })
      );

      setWorkflows(mappedWorkflows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load workflows."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkflows();
  }, [loadWorkflows]);

  const runningCount = workflows.filter(
    (workflow) => workflow.status === "running"
  ).length;

  const completedCount = workflows.filter(
    (workflow) => workflow.status === "done"
  ).length;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main className="flex flex-1 flex-col gap-8 overflow-auto px-4 py-6 sm:px-6 sm:py-7">
          {/* Header */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#D97706]">
                  <WorkflowIcon
                    size={20}
                    strokeWidth={1.8}
                  />
                </div>

                <h1 className="text-[27px] font-semibold tracking-tight text-primary">
                  Workflows
                </h1>
              </div>

              <p className="mt-2 text-[15px] leading-6 text-muted">
                Every workflow OneAgent has run,
                is running, or has queued.
              </p>
            </div>

            {!loading && !error && (
              <div className="flex flex-wrap gap-2">
                <SummaryBadge
                  label="Total"
                  value={workflows.length}
                />

                <SummaryBadge
                  label="Running"
                  value={runningCount}
                  active={runningCount > 0}
                />

                <SummaryBadge
                  label="Completed"
                  value={completedCount}
                />
              </div>
            )}
          </div>

          {/* Loading */}
          {loading ? (
            <div
              className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-border bg-card"
              role="status"
              aria-live="polite"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7ED]">
                  <Activity
                    size={21}
                    className="animate-pulse text-[#D97706]"
                  />
                </div>

                <p className="text-[15px] font-semibold text-primary">
                  Loading workflows...
                </p>

                <p className="mt-1.5 text-[13px] text-faint">
                  Connecting to the OneAgent backend.
                </p>
              </div>
            </div>
          ) : error ? (
            <div
              className="flex flex-col gap-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <div>
                <p className="text-[15px] font-semibold text-[#B91C1C]">
                  Unable to load workflows
                </p>

                <p className="mt-1.5 text-[13px] leading-5 text-[#B91C1C]/80">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadWorkflows()}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#FECACA] bg-white px-3.5 py-2 text-[13px] font-medium text-[#B91C1C] transition-colors hover:bg-[#FFF7F7] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          ) : (
            <WorkflowsList workflows={workflows} />
          )}
        </main>
      </div>
    </div>
  );
}

function SummaryBadge({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5">
      <span
        className={`h-2 w-2 rounded-full ${
          active
            ? "bg-[#D97706]"
            : "bg-[#9CA3AF]"
        }`}
        aria-hidden="true"
      />

      <span className="text-[12px] text-muted">
        {label}
      </span>

      <span className="text-[14px] font-semibold text-primary">
        {value}
      </span>
    </div>
  );
}