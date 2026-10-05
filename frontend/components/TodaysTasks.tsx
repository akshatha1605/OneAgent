"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

type TodaysTasksProps = {
  tasks?: string[];
};

export default function TodaysTasks({
  tasks = [],
}: TodaysTasksProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-primary">
            Today&apos;s Tasks
          </h3>

          <p className="mt-0.5 text-[12px] text-faint">
            Tasks processed today
          </p>
        </div>

        <Link
          href="/history"
          aria-label="View today's task history"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-background hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <ArrowUpRight size={17} />
        </Link>
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <div className="mt-5 flex min-h-[110px] items-center justify-center rounded-xl border border-dashed border-border bg-background">
          <div className="text-center">
            <CheckCircle2
              size={20}
              className="mx-auto text-[#9CA3AF]"
            />

            <p className="mt-2 text-[13px] font-medium text-primary">
              No tasks for today
            </p>

            <p className="mt-0.5 text-[11.5px] text-faint">
              Completed tasks will appear here.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-2">
          {tasks.map((task, index) => (
            <li
              key={`${task}-${index}`}
              className="group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-background"
            >
              <span
                className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED]"
                aria-hidden="true"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
              </span>

              <span className="min-w-0 flex-1 text-[13.5px] leading-5 text-[#374151]">
                {task}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}