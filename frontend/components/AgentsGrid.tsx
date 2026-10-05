"use client";

import { useState } from "react";
import {
  Bot,
  Wrench,
  Activity,
  CircleCheck,
  CircleOff,
} from "lucide-react";

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
  online: "bg-[#16A34A]",
  idle: "bg-[#D97706]",
  offline: "bg-[#9CA3AF]",
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

  const modelCount = agents.filter(
    (agent) => agent.type === "llm"
  ).length;

  const toolCount = agents.filter(
    (agent) => agent.type === "tool"
  ).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<Bot size={18} />}
          label="Total agents"
          value={agents.length}
        />

        <SummaryCard
          icon={<Activity size={18} />}
          label="Models"
          value={modelCount}
        />

        <SummaryCard
          icon={<Wrench size={18} />}
          label="Tools"
          value={toolCount}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div
          className="flex w-fit items-center gap-1.5 rounded-xl border border-border bg-card p-1"
          role="tablist"
          aria-label="Agent type filter"
        >
          {(["all", "llm", "tool"] as const).map((value) => {
            const active = filter === value;

            const label =
              value === "all"
                ? "All agents"
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
                className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:bg-background hover:text-primary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="hidden text-[13px] text-faint sm:block">
          Showing{" "}
          <span className="font-medium text-primary">
            {filteredAgents.length}
          </span>{" "}
          {filteredAgents.length === 1 ? "agent" : "agents"}
        </div>
      </div>

      {/* Agent cards */}
      {filteredAgents.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border bg-card">
          <div className="text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7ED]">
              <Bot
                size={20}
                className="text-[#D97706]"
              />
            </div>

            <p className="mt-3 text-[15px] font-semibold text-primary">
              No agents found
            </p>

            <p className="mt-1.5 text-[13px] text-faint">
              {agents.length === 0
                ? "No agents are currently connected."
                : "No agents match the selected filter."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentCard({
  agent,
}: {
  agent: Agent;
}) {
  const isOnline = agent.status === "online";
  const isIdle = agent.status === "idle";

  return (
    <div className="group flex min-h-[265px] flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D97706]/30 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              agent.type === "llm"
                ? "bg-[#FFF7ED] text-[#D97706]"
                : "bg-[#F3F4F6] text-[#4B5563]"
            }`}
          >
            {agent.type === "llm" ? (
              <Bot size={20} strokeWidth={1.8} />
            ) : (
              <Wrench size={19} strokeWidth={1.8} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[agent.status]}`}
                aria-label={`Status: ${STATUS_LABEL[agent.status]}`}
              />

              <span className="truncate text-[16px] font-semibold text-primary">
                {agent.name}
              </span>
            </div>

            <div className="mt-1 truncate text-[13px] text-faint">
              {agent.provider}
            </div>
          </div>
        </div>

        <span className="shrink-0 rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold text-[#374151]">
          {TYPE_LABEL[agent.type]}
        </span>
      </div>

      {/* Description */}
      <p className="mt-5 text-[14px] leading-6 text-muted">
        {agent.description}
      </p>

      {/* Capabilities */}
      <div className="mt-4 flex min-h-[32px] flex-wrap gap-2">
        {agent.capabilities.length > 0 ? (
          agent.capabilities.map((capability) => (
            <span
              key={capability}
              className="rounded-lg bg-[#FFF7ED] px-2.5 py-1 text-[11.5px] font-medium text-[#B45309]"
            >
              {capability}
            </span>
          ))
        ) : (
          <span className="text-[12px] text-faint">
            No capabilities listed
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-[#F0F0EE] pt-4">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-faint">
            Usage
          </div>

          <div className="mt-0.5">
            <span className="font-mono text-[15px] font-semibold text-primary">
              {agent.callsToday.toLocaleString()}
            </span>

            <span className="ml-1 text-[12px] text-faint">
              calls today
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 text-[12px] font-semibold ${
            isOnline
              ? "text-[#15803D]"
              : isIdle
              ? "text-[#B45309]"
              : "text-[#6B7280]"
          }`}
        >
          {isOnline ? (
            <CircleCheck size={14} />
          ) : isIdle ? (
            <Activity size={14} />
          ) : (
            <CircleOff size={14} />
          )}

          {STATUS_LABEL[agent.status]}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF7ED] text-[#D97706]">
        {icon}
      </div>

      <div>
        <div className="text-[12px] text-faint">
          {label}
        </div>

        <div className="mt-0.5 text-[18px] font-semibold text-primary">
          {value}
        </div>
      </div>
    </div>
  );
}