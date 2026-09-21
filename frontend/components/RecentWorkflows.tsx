"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

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

export default function RecentWorkflows({
  workflows = [],
}: RecentWorkflowsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-primary">
          Recent Workflows
        </h3>

        <Link
          href="/workflows"
          className="flex items-center gap-0.5 text-[11.5px] font-medium text-accent hover:underline"
        >
          View all
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Empty state */}
      {workflows.length === 0 ? (
        <div className="flex min-h-[100px] items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-[12px] text-faint">
            No recent workflows.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {workflows.map((workflow, index) => {
            const isLast = index === workflows.length - 1;

            const statusColor =
              workflow.status === "done"
                ? "bg-success"
                : workflow.status === "failed"
                  ? "bg-[#DC2626]"
                  : workflow.status === "running"
                    ? "bg-accent"
                    : "bg-[#9CA3AF]";

            return (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className={`flex items-center justify-between py-3 transition-colors hover:bg-[#FFFBF5] ${
                  !isLast ? "border-b border-[#F0F0EE]" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${statusColor}`}
                    aria-label={`Workflow status: ${workflow.status}`}
                  />

                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium text-primary">
                      {workflow.title}
                    </div>

                    <div className="mt-0.5 text-[11px] text-faint">
                      {workflow.agents.length > 0
                        ? workflow.agents.join(" · ")
                        : "No agents assigned"}
                    </div>
                  </div>
                </div>

                <span className="ml-3 shrink-0 text-[11px] text-faint">
                  {workflow.time}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}