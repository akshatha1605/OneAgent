"use client";

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

export type HistoryOutcome = "success" | "failed";
export type HistoryGroup = "Today" | "Yesterday" | "Earlier";

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

const GROUPS: HistoryGroup[] = ["Today", "Yesterday", "Earlier"];

export default function HistoryList({
  entries = [],
}: HistoryListProps) {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((group) => {
        const groupEntries = entries.filter(
          (entry) => entry.group === group
        );

        if (groupEntries.length === 0) {
          return null;
        }

        return (
          <section key={group}>
            <h3 className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-faint">
              {group}
            </h3>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {groupEntries.map((entry, index) => {
                const isLast = index === groupEntries.length - 1;
                const isSuccess = entry.outcome === "success";

                return (
                  <Link
                    key={entry.id}
                    href={`/workflows/${entry.id}`}
                    className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent/20 ${
                      !isLast ? "border-b border-[#F0F0EE]" : ""
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-success"
                        aria-label="Successful workflow"
                      />
                    ) : (
                      <XCircle
                        size={16}
                        className="shrink-0 text-[#DC2626]"
                        aria-label="Failed workflow"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium text-primary">
                        {entry.title}
                      </div>

                      <div className="mt-0.5 truncate text-[11px] text-faint">
                        {entry.agents.length > 0
                          ? entry.agents.join(" · ")
                          : "No agents"}
                      </div>
                    </div>

                    <span className="shrink-0 text-[11px] text-faint">
                      {entry.time}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      {entries.length === 0 && (
        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-border bg-card">
          <div className="text-center">
            <p className="text-[13px] font-medium text-primary">
              No workflow history
            </p>

            <p className="mt-1 text-[11.5px] text-faint">
              Completed and failed workflows will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}