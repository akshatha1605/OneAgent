"use client";

import { useMemo, useState } from "react";
import { Search, Clock, ChevronRight } from "lucide-react";
import { allWorkflows, WorkflowStatus } from "@/lib/mock-data";
import WorkflowStatusBadge from "./WorkflowStatusBadge";

const FILTERS: { label: string; value: WorkflowStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Running", value: "running" },
  { label: "Completed", value: "done" },
  { label: "Failed", value: "failed" },
  { label: "Queued", value: "queued" },
];

export default function WorkflowsList() {
  const [filter, setFilter] = useState<WorkflowStatus | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return allWorkflows.filter((w) => {
      const matchesFilter = filter === "all" || w.status === filter;
      const matchesQuery = w.title.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white border border-border rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-background"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workflows..."
            className="w-full rounded-md border border-border bg-white pl-9 pr-3 py-2 text-[13px] text-primary placeholder:text-faint outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 && (
          <div className="py-10 text-center text-[13px] text-faint">
            No workflows match your filters.
          </div>
        )}

        {filtered.map((w, i) => (
          <div
            key={w.id}
            className={`flex items-center gap-4 px-5 py-4 hover:bg-background transition-colors cursor-pointer ${
              i !== filtered.length - 1 ? "border-b border-[#F0F0EE]" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-[13px] font-semibold text-primary truncate">
                  {w.title}
                </span>
                <WorkflowStatusBadge status={w.status} />
              </div>
              <p className="text-[12px] text-muted truncate">{w.description}</p>

              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  {w.agents.map((a) => (
                    <span
                      key={a}
                      className="text-[10.5px] font-medium px-1.5 py-0.5 rounded bg-[#F0F0EE] text-[#374151]"
                    >
                      {a}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-faint flex items-center gap-1">
                  <Clock size={11} /> {w.createdAt}
                </span>
                {w.duration !== "—" && (
                  <span className="text-[11px] text-faint font-mono">{w.duration}</span>
                )}
              </div>

              {w.status === "running" && (
                <div className="h-1 rounded-full bg-[#F0F0EE] overflow-hidden mt-2.5 w-full max-w-xs">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${w.progress}%` }}
                  />
                </div>
              )}
            </div>

            <ChevronRight size={16} className="text-faint shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
