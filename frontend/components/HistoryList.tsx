"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { historyLog } from "@/lib/mock-data";

const GROUPS = ["Today", "Yesterday", "Earlier"] as const;

export default function HistoryList() {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((group) => {
        const entries = historyLog.filter((h) => h.group === group);
        if (entries.length === 0) return null;
        return (
          <div key={group}>
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-faint mb-2.5">
              {group}
            </h3>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {entries.map((h, i) => (
                <div
                  key={h.id}
                  className={`flex items-center gap-3 px-5 py-3.5 hover:bg-background transition-colors ${
                    i !== entries.length - 1 ? "border-b border-[#F0F0EE]" : ""
                  }`}
                >
                  {h.outcome === "success" ? (
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-[#DC2626] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium text-primary truncate">{h.title}</div>
                    <div className="text-[11px] text-faint mt-0.5">{h.agents.join(" · ")}</div>
                  </div>
                  <span className="text-[11px] text-faint shrink-0">{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
