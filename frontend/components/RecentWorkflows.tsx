"use client";

import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock3,
  XCircle,
} from "lucide-react";

export type RecentWorkflow = {
  id: string;
  title: string;
  agents: string[];
  time: string;
  status: "done" | "failed" | "running" | "queued";
};

type RecentWorkflowsProps = {
  workflows?: RecentWorkflow[];
};

function getStatusIcon(
  status: RecentWorkflow["status"]
) {
  if (status === "done") {
    return (
      <CheckCircle2
        size={16}
        className="text-[#16A34A]"
        aria-hidden="true"
      />
    );
  }

  if (status === "failed") {
    return (
      <XCircle
        size={16}
        className="text-[#DC2626]"
        aria-hidden="true"
      />
    );
  }

  if (status === "running") {
    return (
      <Activity
        size={16}
        className="text-accent"
        aria-hidden="true"
      />
    );
  }

  return (
    <Clock3
      size={16}
      className="text-[#9CA3AF]"
      aria-hidden="true"
    />
  );
}

function getStatusLabel(
  status: RecentWorkflow["status"]
) {
  switch (status) {
    case "done":
      return "Completed";

    case "failed":
      return "Failed";

    case "running":
      return "Running";

    case "queued":
      return "Queued";

    default:
      return status;
  }
}

function getStatusStyles(
  status: RecentWorkflow["status"]
) {
  switch (status) {
    case "done":
      return "bg-[#EAF7EE] text-[#15803D]";

    case "failed":
      return "bg-[#FDECEC] text-[#DC2626]";

    case "running":
      return "bg-[#FFF7ED] text-[#B45309]";

    case "queued":
      return "bg-[#F3F4F6] text-[#6B7280]";

    default:
      return "bg-[#F3F4F6] text-[#6B7280]";
  }
}

export default function RecentWorkflows({
  workflows = [],
}: RecentWorkflowsProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-[16px] font-semibold text-primary">
            Recent Workflows
          </h3>

          <p className="mt-0.5 text-[12px] text-faint">
            Your latest workflow activity
          </p>
        </div>

        <Link
          href="/workflows"
          className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-accent transition-colors hover:bg-[#FFF7ED]"
        >
          View all
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Empty state */}
      {workflows.length === 0 ? (
        <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-5 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
            <Activity
              size={18}
              className="text-muted"
              aria-hidden="true"
            />
          </div>

          <p className="text-[14px] font-medium text-primary">
            No recent workflows
          </p>

          <p className="mt-1 text-[12px] text-faint">
            Completed and active workflows will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {workflows.map((workflow, index) => {
            const isLast =
              index === workflows.length - 1;

            return (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className={`group flex items-center justify-between gap-4 rounded-xl px-2 py-4 transition-colors hover:bg-[#FFFBF5] ${
                  !isLast
                    ? "border-b border-[#F0F0EE]"
                    : ""
                }`}
              >
                {/* Workflow info */}
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${getStatusStyles(
                      workflow.status
                    )}`}
                  >
                    {getStatusIcon(workflow.status)}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-primary">
                      {workflow.title}
                    </div>

                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <span className="truncate text-[12px] text-faint">
                        {workflow.agents.length > 0
                          ? workflow.agents.join(" · ")
                          : "No agents assigned"}
                      </span>

                      <span className="shrink-0 text-[#D1D1CC]">
                        •
                      </span>

                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusStyles(
                          workflow.status
                        )}`}
                      >
                        {getStatusLabel(
                          workflow.status
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time + arrow */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[12px] text-faint">
                    {workflow.time}
                  </span>

                  <ChevronRight
                    size={15}
                    className="text-[#C4C4BE] transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}