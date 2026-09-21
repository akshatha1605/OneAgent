"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type TodaysTasksProps = {
  tasks?: string[];
};

export default function TodaysTasks({
  tasks = [],
}: TodaysTasksProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-primary">
          Today&rsquo;s Tasks
        </h3>

        <Link
          href="/history"
          aria-label="View today's task history"
          className="rounded-md p-1 text-faint transition-colors hover:bg-[#F0F0EE] hover:text-primary"
        >
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-3 flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-[12px] text-faint">
            No tasks for today.
          </p>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {tasks.map((task, index) => (
            <li
              key={`${task}-${index}`}
              className="flex items-start gap-2 text-[12.5px] text-[#374151]"
            >
              <span
                className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent"
                aria-hidden="true"
              />

              <span className="min-w-0">{task}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}