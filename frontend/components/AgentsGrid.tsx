"use client";

import { agentsCatalog, AgentType } from "@/lib/mock-data";
import { useState } from "react";

const STATUS_DOT: Record<string, string> = {
  online: "bg-success",
  idle: "bg-[#D1D5DB]",
  offline: "bg-[#E5E5E5]",
};

const TYPE_LABEL: Record<AgentType, string> = { llm: "Model", tool: "Tool" };

export default function AgentsGrid() {
  const [filter, setFilter] = useState<"all" | AgentType>("all");
  const filtered = agentsCatalog.filter((a) => filter === "all" || a.type === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5 bg-white border border-border rounded-lg p-1 w-fit">
        {(["all", "llm", "tool"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${
              filter === f ? "bg-primary text-white" : "text-muted hover:bg-background"
            }`}
          >
            {f === "all" ? "All" : f === "llm" ? "Models" : "Tools"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[a.status]}`} />
                  <span className="text-[13.5px] font-semibold text-primary">{a.name}</span>
                </div>
                <div className="text-[11px] text-faint mt-0.5">{a.provider}</div>
              </div>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F0F0EE] text-[#374151]">
                {TYPE_LABEL[a.type]}
              </span>
            </div>

            <p className="text-[12px] text-muted leading-snug">{a.description}</p>

            <div className="flex flex-wrap gap-1.5">
              {a.capabilities.map((c) => (
                <span key={c} className="text-[10.5px] px-1.5 py-0.5 rounded bg-accent-tint text-[#B45309]">
                  {c}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#F0F0EE] mt-1">
              <span className="text-[11px] text-faint">
                <span className="font-mono text-primary">{a.callsToday}</span> calls today
              </span>
              <span className="text-[11px] text-faint capitalize">{a.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
