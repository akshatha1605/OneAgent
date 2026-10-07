"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  ChevronRight,
  X,
  Workflow as WorkflowIcon,
} from "lucide-react";
import WorkflowStatusBadge from "./WorkflowStatusBadge";

export type WorkflowStatus =
  | "running"
  | "done"
  | "failed"
  | "queued";

export type Workflow = {
  id: string;
  title: string;
  description: string;
  status: WorkflowStatus;
  agents: string[];
  stepCount?: number;
  createdAt: string;
  updatedAt?: string;
  duration: string;
  progress?: number;
};

type WorkflowsListProps = {
  workflows?: Workflow[];
};

const FILTERS: {
  label: string;
  value: WorkflowStatus | "all";
}[] = [
  { label: "All", value: "all" },
  { label: "Running", value: "running" },
  { label: "Completed", value: "done" },
  { label: "Failed", value: "failed" },
  { label: "Queued", value: "queued" },
];

export default function WorkflowsList({
  workflows = [],
}: WorkflowsListProps) {
  const [filter, setFilter] =
    useState<WorkflowStatus | "all">("all");

  const [query, setQuery] = useState("");

  const filteredWorkflows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return workflows.filter((workflow) => {
      const matchesFilter =
        filter === "all" || workflow.status === filter;

      if (!normalizedQuery) {
        return matchesFilter;
      }

      const searchableText = [
        workflow.title,
        workflow.description,
        ...workflow.agents,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesFilter &&
        searchableText.includes(normalizedQuery)
      );
    });
  }, [workflows, filter, query]);

  const clearSearch = () => {
    setQuery("");
  };

  const clearFilters = () => {
    setQuery("");
    setFilter("all");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Status filters */}
        <div
          className="flex w-fit max-w-full items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-card p-1"
          role="tablist"
          aria-label="Workflow status filter"
        >
          {FILTERS.map((item) => {
            const active = filter === item.value;

            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(item.value)}
                className={`shrink-0 rounded-lg px-4 py-2 text-[13px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:bg-background hover:text-primary"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
            aria-hidden="true"
          />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search workflows..."
            aria-label="Search workflows"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-[14px] text-primary outline-none transition-all placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/10"
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear workflow search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition-colors hover:bg-background hover:text-primary"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      {workflows.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-faint">
            Showing{" "}
            <span className="font-semibold text-primary">
              {filteredWorkflows.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-primary">
              {workflows.length}
            </span>{" "}
            workflows
          </p>

          {(query || filter !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[13px] font-medium text-accent hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Workflow list */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {workflows.length === 0 ? (
          <EmptyState
            title="No workflows yet"
            description="Create your first workflow to chain multiple AI tasks."
          />
        ) : filteredWorkflows.length === 0 ? (
          <EmptyState
            title="No workflows match your filters"
            description="Try a different status or search term."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-background"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          filteredWorkflows.map((workflow, index) => {
            const isLast =
              index === filteredWorkflows.length - 1;

            const progress = Math.min(
              100,
              Math.max(0, workflow.progress ?? 0)
            );

            return (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className={`group flex items-start gap-4 px-5 py-5 transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent/20 sm:px-6 ${
                  !isLast
                    ? "border-b border-[#F0F0EE]"
                    : ""
                }`}
              >
                {/* Workflow icon */}
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#D97706] sm:flex">
                  <WorkflowIcon
                    size={19}
                    strokeWidth={1.8}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {/* Title + status */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="truncate text-[16px] font-semibold text-primary group-hover:text-[#B45309]">
                      {workflow.title}
                    </span>

                    <WorkflowStatusBadge
                      status={workflow.status}
                    />
                  </div>

                  {/* Description */}
                  <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-5 text-muted">
                    {workflow.description}
                  </p>

                  {/* Metadata */}
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    {typeof workflow.stepCount === "number" && (
                      <span className="text-[11px] text-faint">
                        {workflow.stepCount}{" "}
                        {workflow.stepCount === 1 ? "step" : "steps"}
                      </span>
                    )}

                    {workflow.agents.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {workflow.agents.map((agent) => (
                          <span
                            key={agent}
                            className="rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-medium text-[#374151]"
                          >
                            {agent}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="flex items-center gap-1.5 text-[12px] text-faint">
                      <Clock
                        size={13}
                        aria-hidden="true"
                      />
                      {workflow.createdAt}
                    </span>

                    {workflow.updatedAt &&
                      workflow.updatedAt !== workflow.createdAt && (
                        <span className="text-[11px] text-faint">
                          Updated {workflow.updatedAt}
                        </span>
                      )}

                    {workflow.duration !== "—" && (
                      <span className="rounded-md bg-[#F8F8F7] px-2 py-1 font-mono text-[11px] text-faint">
                        {workflow.duration}
                      </span>
                    )}
                  </div>

                  {/* Running progress */}
                  {workflow.status === "running" && (
                    <div className="mt-4 max-w-md">
                      <div className="mb-1.5 flex items-center justify-between text-[11px]">
                        <span className="text-faint">
                          Progress
                        </span>

                        <span className="font-medium text-primary">
                          {progress}%
                        </span>
                      </div>

                      <div
                        className="h-1.5 w-full overflow-hidden rounded-full bg-[#F0F0EE]"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${workflow.title} progress`}
                      >
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="mt-2 shrink-0 rounded-lg p-1.5 text-faint transition-all group-hover:translate-x-0.5 group-hover:bg-[#FFF7ED] group-hover:text-[#D97706]">
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                  />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[260px] items-center justify-center px-5 py-12 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#D97706]">
          <WorkflowIcon
            size={21}
            strokeWidth={1.8}
          />
        </div>

        <p className="mt-4 text-[16px] font-semibold text-primary">
          {title}
        </p>

        <p className="mt-1.5 text-[13px] text-faint">
          {description}
        </p>

        {action}
      </div>
    </div>
  );
}