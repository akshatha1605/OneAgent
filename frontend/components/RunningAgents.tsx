"use client";

import {
  Activity,
  Bot,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export type RunningAgent = {
  id: string;
  name: string;
  task: string;
  progress: number;
  tone?: string;
};

type RunningAgentsProps = {
  agents?: RunningAgent[];
};

export default function RunningAgents({
  agents = [],
}: RunningAgentsProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF7ED]">
            <Activity
              size={17}
              className="text-[#D97706]"
              aria-hidden="true"
            />
          </div>

          <div>
            <h3 className="text-[16px] font-semibold text-primary">
              Running Agents
            </h3>

            <p className="mt-0.5 text-[12px] text-faint">
              Active agent executions
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold text-muted">
          {agents.length}{" "}
          {agents.length === 1 ? "active" : "active"}
        </span>
      </div>

      {/* Empty state */}
      {agents.length === 0 ? (
        <div className="flex min-h-[130px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-5 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
            <CheckCircle2
              size={19}
              className="text-muted"
              aria-hidden="true"
            />
          </div>

          <p className="text-[14px] font-medium text-primary">
            No agents are running
          </p>

          <p className="mt-1 text-[12px] text-faint">
            Active agent executions will appear here.
          </p>
        </div>
      ) : (
        /* Agent list */
        <div className="flex flex-col gap-5">
          {agents.map((agent) => {
            const progress = Math.min(
              100,
              Math.max(0, agent.progress)
            );

            const tone = agent.tone ?? "#D97706";

            const isComplete = progress >= 100;

            return (
              <div
                key={agent.id}
                className="rounded-xl border border-[#F0F0EE] bg-background p-4 transition-colors hover:border-[#E4E4DF]"
              >
                {/* Agent header */}
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${tone}15`,
                      }}
                    >
                      {isComplete ? (
                        <CheckCircle2
                          size={16}
                          style={{ color: tone }}
                          aria-hidden="true"
                        />
                      ) : (
                        <Bot
                          size={16}
                          style={{ color: tone }}
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-semibold text-primary">
                          {agent.name}
                        </span>

                        {!isComplete && (
                          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-muted">
                            <Loader2
                              size={11}
                              className="animate-spin"
                            />
                            Running
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="shrink-0 font-mono text-[12px] font-semibold text-primary">
                    {progress}%
                  </span>
                </div>

                {/* Task */}
                <div className="mb-3 pl-[42px]">
                  <p className="truncate text-[12.5px] text-muted">
                    {agent.task}
                  </p>
                </div>

                {/* Progress */}
                <div
                  className="h-2 overflow-hidden rounded-full bg-[#ECECE8]"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${agent.name} progress`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: tone,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}