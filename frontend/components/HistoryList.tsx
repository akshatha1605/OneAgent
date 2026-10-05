"use client";

import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  History,
} from "lucide-react";

export type HistoryOutcome = "success" | "failed";

export type HistoryGroup =
  | "Today"
  | "Yesterday"
  | "Earlier";

export type HistoryEntry = {
  id: string;
  title: string;
  agents: string[];
  time: string;
  outcome: HistoryOutcome;
  group: HistoryGroup;
};

type HistoryListProps = {
  entries?: HistoryEntry[];
};

const GROUPS: HistoryGroup[] = [
  "Today",
  "Yesterday",
  "Earlier",
];

export default function HistoryList({
  entries = [],
}: HistoryListProps) {
  return (
    <div className="flex flex-col gap-7">
      {GROUPS.map((group) => {
        const groupEntries = entries.filter(
          (entry) => entry.group === group
        );

        if (groupEntries.length === 0) {
          return null;
        }

        return (
          <section key={group}>
            {/* Group heading */}
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                {group}
              </h3>

              <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold text-faint">
                {groupEntries.length}
              </span>
            </div>

            {/* Entries */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {groupEntries.map((entry, index) => {
                const isLast =
                  index === groupEntries.length - 1;

                const isSuccess =
                  entry.outcome === "success";

                return (
                  <Link
                    key={entry.id}
                    href={`/workflows/${entry.id}`}
                    className={`group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#FFFBF5] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent/20 ${
                      !isLast
                        ? "border-b border-[#F0F0EE]"
                        : ""
                    }`}
                  >
                    {/* Outcome icon */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isSuccess
                          ? "bg-[#EAF7EE]"
                          : "bg-[#FDECEC]"
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2
                          size={17}
                          className="text-[#16A34A]"
                          aria-label="Successful workflow"
                        />
                      ) : (
                        <XCircle
                          size={17}
                          className="text-[#DC2626]"
                          aria-label="Failed workflow"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium text-primary">
                        {entry.title}
                      </div>

                      <div className="mt-1 truncate text-[12px] text-faint">
                        {entry.agents.length > 0
                          ? entry.agents.join(" · ")
                          : "No agents"}
                      </div>
                    </div>

                    {/* Time */}
                    <span className="shrink-0 text-[12px] text-faint">
                      {entry.time}
                    </span>

                    {/* Arrow */}
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-[#C4C4BE] transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-5 text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F4F6]">
            <History
              size={20}
              className="text-muted"
              aria-hidden="true"
            />
          </div>

          <p className="text-[15px] font-semibold text-primary">
            No workflow history
          </p>

          <p className="mt-1.5 max-w-sm text-[12px] leading-5 text-faint">
            Completed and failed workflows will appear
            here after you start using OneAgent.
          </p>
        </div>
      )}
    </div>
  );
}