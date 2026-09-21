"use client";

export type ConnectedAgent = {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline" | "busy";
};

type ConnectedAgentsProps = {
  agents?: ConnectedAgent[];
};

export default function ConnectedAgents({
  agents = [],
}: ConnectedAgentsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-[13px] font-semibold text-primary">
        Connected Agents
      </h3>

      {agents.length === 0 ? (
        <div className="flex min-h-[100px] items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-[12px] text-faint">
            No agents connected.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {agents.map((agent) => {
            const statusColor =
              agent.status === "online"
                ? "bg-success"
                : agent.status === "busy"
                  ? "bg-accent"
                  : "bg-[#D1D5DB]";

            return (
              <div
                key={agent.id}
                className="flex items-center gap-2.5 rounded-lg border border-[#F0F0EE] bg-background px-3 py-2.5"
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColor}`}
                  aria-label={`Agent status: ${agent.status}`}
                />

                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-primary">
                    {agent.name}
                  </div>

                  <div className="truncate text-[10.5px] text-faint">
                    {agent.role}
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