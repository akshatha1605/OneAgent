"use client";

import { runningAgents } from "@/lib/mock-data";

export default function RunningAgents() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-primary">Running Agents</h3>
        <span className="text-[11.5px] text-faint">{runningAgents.length} active</span>
      </div>
      <div className="flex flex-col gap-4">
        {runningAgents.map((a) => (
          <div key={a.name}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: a.tone }}
                />
                <span className="text-[12.5px] font-medium text-primary">{a.name}</span>
              </div>
              <span className="text-[11.5px] text-faint font-mono">{a.pct}%</span>
            </div>
            <div className="text-[11.5px] text-muted mb-1.5 truncate">{a.task}</div>
            <div className="h-1.5 rounded-full bg-[#F0F0EE] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${a.pct}%`, backgroundColor: a.tone }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
