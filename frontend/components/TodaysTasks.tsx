"use client";

import { ArrowUpRight } from "lucide-react";
import { todaysTasks } from "@/lib/mock-data";

export default function TodaysTasks() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[13px] font-semibold text-primary">Today&rsquo;s Tasks</h3>
        <ArrowUpRight size={14} className="text-faint" />
      </div>
      <ul className="mt-3 flex flex-col gap-2.5">
        {todaysTasks.map((t) => (
          <li key={t} className="flex items-start gap-2 text-[12.5px] text-[#374151]">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-accent shrink-0" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
