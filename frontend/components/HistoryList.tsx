"use client";

import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  History,
  ChevronRight,
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
  result: string;
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
            <div className="flex flex-col gap-3">
              {groupEntries.map((entry) => {
                const isSuccess =
                  entry.outcome === "success";

                return (
                  <Link
                    key={entry.id}
                    href={`/history/${entry.id}`}
                    className="group block rounded-2xl border border-border bg-card px-5 py-5 transition-all hover:border-[#D9D9D4] hover:bg-[#FCFCFA]"
                  >
                    <div className="flex items-center gap-4">
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
                          />
                        ) : (
                          <XCircle
                            size={17}
                            className="text-[#DC2626]"
                          />
                        )}
                      </div>

                      {/* Task information */}
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-[15px] font-semibold leading-6 text-primary">
                          {entry.title}
                        </h4>

                        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-faint">
                          <span>
                            {entry.agents.length > 0
                              ? entry.agents.join(" · ")
                              : "No agents"}
                          </span>

                          <span>·</span>

                          <span>{entry.time}</span>

                          <span>·</span>

                          <span>
                            {isSuccess
                              ? "Completed"
                              : "Failed"}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight
                        size={19}
                        className="shrink-0 text-faint transition-transform group-hover:translate-x-1 group-hover:text-primary"
                      />
                    </div>
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
            No task history
          </p>

          <p className="mt-1.5 max-w-sm text-[12px] leading-5 text-faint">
            Completed and failed tasks will appear
            here after you start using OneAgent.
          </p>
        </div>
      )}
    </div>
  );
}