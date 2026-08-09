"use client";

import { ChevronRight } from "lucide-react";
import { recentWorkflows } from "@/lib/mock-data";

export default function RecentWorkflows() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-primary">Recent Workflows</h3>
        <button className="text-[11.5px] font-medium text-accent flex items-center gap-0.5 hover:underline">
          View all <ChevronRight size={13} />
        </button>
      </div>
      <div className="flex flex-col">
        {recentWorkflows.map((w, i) => (
          <div
            key={w.title}
            className={`flex items-center justify-between py-3 ${
              i !== recentWorkflows.length - 1 ? "border-b border-[#F0F0EE]" : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  w.status === "done" ? "bg-success" : "bg-[#DC2626]"
                }`}
              />
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-primary truncate">
                  {w.title}
                </div>
                <div className="text-[11px] text-faint mt-0.5">
                  {w.agents.join(" · ")}
                </div>
              </div>
            </div>
            <span className="text-[11px] text-faint shrink-0 ml-3">{w.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
