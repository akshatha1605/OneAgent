"use client";

import {
  Bot,
  CircleCheck,
  CircleOff,
  Loader2,
} from "lucide-react";

export type ConnectedAgent = {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline" | "busy";
};

type ConnectedAgentsProps = {
  agents?: ConnectedAgent[];
};

function getStatusConfig(
  status: ConnectedAgent["status"]
) {
  switch (status) {
    case "online":
      return {
        label: "Online",
        dot: "bg-[#16A34A]",
        text: "text-[#15803D]",
        background: "bg-[#EAF7EE]",
        Icon: CircleCheck,
      };

    case "busy":
      return {
        label: "Busy",
        dot: "bg-[#D97706]",
        text: "text-[#B45309]",
        background: "bg-[#FFF7ED]",
        Icon: Loader2,
      };

    case "offline":
    default:
      return {
        label: "Offline",
        dot: "bg-[#9CA3AF]",
        text: "text-[#6B7280]",
        background: "bg-[#F3F4F6]",
        Icon: CircleOff,
      };
  }
}

export default function ConnectedAgents({
  agents = [],
}: ConnectedAgentsProps) {
  const onlineCount = agents.filter(
    (agent) => agent.status === "online"
  ).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF7ED]">
            <Bot
              size={17}
              className="text-[#D97706]"
              aria-hidden="true"
            />
          </div>

          <div>
            <h3 className="text-[16px] font-semibold text-primary">
              Connected Agents
            </h3>

            <p className="mt-0.5 text-[12px] text-faint">
              Available workspace agents
            </p>
          </div>
        </div>

        {agents.length > 0 && (
          <span className="rounded-full bg-[#EAF7EE] px-2.5 py-1 text-[11px] font-semibold text-[#15803D]">
            {onlineCount} online
          </span>
        )}
      </div>

      {/* Empty state */}
      {agents.length === 0 ? (
        <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-5 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
            <Bot
              size={19}
              className="text-muted"
              aria-hidden="true"
            />
          </div>

          <p className="text-[14px] font-medium text-primary">
            No agents connected
          </p>

          <p className="mt-1 text-[12px] text-faint">
            Connected agents will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {agents.map((agent) => {
            const config = getStatusConfig(
              agent.status
            );

            const StatusIcon = config.Icon;

            return (
              <div
                key={agent.id}
                className="group rounded-xl border border-[#F0F0EE] bg-background p-4 transition-all duration-200 hover:border-[#E4E4DF] hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Agent */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6]">
                      <Bot
                        size={17}
                        className="text-primary"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-primary">
                        {agent.name}
                      </div>

                      <div className="mt-0.5 truncate text-[12px] text-faint">
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 ${config.background}`}
                  >
                    {agent.status === "busy" ? (
                      <StatusIcon
                        size={11}
                        className={`${config.text} animate-spin`}
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
                        aria-hidden="true"
                      />
                    )}

                    <span
                      className={`text-[10px] font-semibold ${config.text}`}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}