"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  ChevronRight,
  X,
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
  createdAt: string;
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

  return (
    <div className="flex flex-col gap-4">
      {/* Filters + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex w-fit items-center gap-1.5 overflow-x-auto rounded-lg border border-border bg-white p-1"
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
                className={`shrink-0 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                  active
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-background hover:text-primary"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            aria-hidden="true"
          />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search workflows..."
            aria-label="Search workflows"
            className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-9 text-[13px] text-primary outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/10"
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear workflow search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-faint hover:bg-background hover:text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Workflow list */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {workflows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[13px] font-medium text-primary">
              No workflows yet
            </p>

            <p className="mt-1 text-[11.5px] text-faint">
              Workflows you create will appear here.
            </p>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[13px] font-medium text-primary">
              No workflows match your filters
            </p>

            <p className="mt-1 text-[11.5px] text-faint">
              Try a different status or search term.
            </p>

            {(query || filter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="mt-3 text-[12px] font-medium text-accent hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
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
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent/20 ${
                  !isLast
                    ? "border-b border-[#F0F0EE]"
                    : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  {/* Title + status */}
                  <div className="mb-1 flex items-center gap-2.5">
                    <span className="truncate text-[13px] font-semibold text-primary">
                      {workflow.title}
                    </span>

                    <WorkflowStatusBadge
                      status={workflow.status}
                    />
                  </div>

                  {/* Description */}
                  <p className="truncate text-[12px] text-muted">
                    {workflow.description}
                  </p>

                  {/* Metadata */}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {workflow.agents.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {workflow.agents.map((agent) => (
                          <span
                            key={agent}
                            className="rounded bg-[#F0F0EE] px-1.5 py-0.5 text-[10.5px] font-medium text-[#374151]"
                          >
                            {agent}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="flex items-center gap-1 text-[11px] text-faint">
                      <Clock size={11} aria-hidden="true" />
                      {workflow.createdAt}
                    </span>

                    {workflow.duration !== "—" && (
                      <span className="font-mono text-[11px] text-faint">
                        {workflow.duration}
                      </span>
                    )}
                  </div>

                  {/* Running progress */}
                  {workflow.status === "running" && (
                    <div
                      className="mt-2.5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-[#F0F0EE]"
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
                  )}
                </div>

                <ChevronRight
                  size={16}
                  className="shrink-0 text-faint"
                  aria-hidden="true"
                />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}