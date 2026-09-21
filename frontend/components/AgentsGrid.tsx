"use client";

import { useState } from "react";

export type AgentType = "llm" | "tool";
export type AgentStatus = "online" | "idle" | "offline";

export type Agent = {
  id: string;
  name: string;
  provider: string;
  type: AgentType;
  status: AgentStatus;
  description: string;
  capabilities: string[];
  callsToday: number;
};

type AgentsGridProps = {
  agents?: Agent[];
};

const STATUS_DOT: Record<AgentStatus, string> = {
  online: "bg-success",
  idle: "bg-[#D1D5DB]",
  offline: "bg-[#E5E5E5]",
};

const TYPE_LABEL: Record<AgentType, string> = {
  llm: "Model",
  tool: "Tool",
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  online: "Online",
  idle: "Idle",
  offline: "Offline",
};

export default function AgentsGrid({
  agents = [],
}: AgentsGridProps) {
  const [filter, setFilter] = useState<"all" | AgentType>("all");

  const filteredAgents = agents.filter(
    (agent) => filter === "all" || agent.type === filter
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div
        className="flex w-fit items-center gap-1.5 rounded-lg border border-border bg-white p-1"
        role="tablist"
        aria-label="Agent type filter"
      >
        {(["all", "llm", "tool"] as const).map((value) => {
          const active = filter === value;

          const label =
            value === "all"
              ? "All"
              : value === "llm"
                ? "Models"
                : "Tools";

          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                active
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-background hover:text-primary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Agent cards */}
      {filteredAgents.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-border bg-card">
          <div className="text-center">
            <p className="text-[13px] font-medium text-primary">
              No agents found
            </p>
            <p className="mt-1 text-[11.5px] text-faint">
              {agents.length === 0
                ? "No agents are currently connected."
                : "No agents match the selected filter."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[agent.status]}`}
                      aria-label={`Status: ${STATUS_LABEL[agent.status]}`}
                    />

                    <span className="truncate text-[13.5px] font-semibold text-primary">
                      {agent.name}
                    </span>
                  </div>

                  <div className="mt-0.5 truncate text-[11px] text-faint">
                    {agent.provider}
                  </div>
                </div>

                <span className="shrink-0 rounded bg-[#F0F0EE] px-1.5 py-0.5 text-[10px] font-medium text-[#374151]">
                  {TYPE_LABEL[agent.type]}
                </span>
              </div>

              {/* Description */}
              <p className="text-[12px] leading-snug text-muted">
                {agent.description}
              </p>

              {/* Capabilities */}
              {agent.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="rounded bg-accent-tint px-1.5 py-0.5 text-[10.5px] text-[#B45309]"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-1 flex items-center justify-between border-t border-[#F0F0EE] pt-2">
                <span className="text-[11px] text-faint">
                  <span className="font-mono text-primary">
                    {agent.callsToday.toLocaleString()}
                  </span>{" "}
                  calls today
                </span>

                <span
                  className={`text-[11px] font-medium ${
                    agent.status === "online"
                      ? "text-[#15803D]"
                      : agent.status === "idle"
                        ? "text-[#6B7280]"
                        : "text-[#9CA3AF]"
                  }`}
                >
                  {STATUS_LABEL[agent.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}