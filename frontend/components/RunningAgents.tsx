"use client";

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
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-primary">
          Running Agents
        </h3>

        <span className="text-[11.5px] text-faint">
          {agents.length} {agents.length === 1 ? "active" : "active"}
        </span>
      </div>

      {agents.length === 0 ? (
        <div className="flex min-h-[100px] items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-[12px] text-faint">
            No agents are currently running.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {agents.map((agent) => {
            const progress = Math.min(
              100,
              Math.max(0, agent.progress)
            );

            const tone = agent.tone ?? "#D97706";

            return (
              <div key={agent.id}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tone }}
                      aria-hidden="true"
                    />

                    <span className="truncate text-[12.5px] font-medium text-primary">
                      {agent.name}
                    </span>
                  </div>

                  <span className="ml-3 shrink-0 font-mono text-[11.5px] text-faint">
                    {progress}%
                  </span>
                </div>

                <div className="mb-1.5 truncate text-[11.5px] text-muted">
                  {agent.task}
                </div>

                <div
                  className="h-1.5 overflow-hidden rounded-full bg-[#F0F0EE]"
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