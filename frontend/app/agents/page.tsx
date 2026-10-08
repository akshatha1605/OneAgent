"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AgentsGrid, {
  type Agent,
} from "@/components/AgentsGrid";
import { getAgents } from "@/lib/api";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAgents();

      const mappedAgents: Agent[] = data.agents.map(
        (agent, index) => ({
          id: agent.id ?? `agent-${index}`,
          name: agent.name ?? "Unnamed Agent",
          provider: agent.provider ?? "Unknown",

          type:
            agent.type === "tool"
              ? "tool"
              : "llm",

          status:
            agent.status === "online"
              ? "online"
              : agent.status === "offline"
              ? "offline"
              : "idle",

          description:
            agent.description ??
            "No description provided.",

          capabilities:
            agent.capabilities ?? [],

          callsToday:
            agent.callsToday ?? 0,
        })
      );

      setAgents(mappedAgents);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load agents."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  const onlineAgents = agents.filter(
    (agent) => agent.status === "online"
  ).length;

  return (
    <div className="flex h-dvh w-full min-h-0 overflow-hidden bg-background">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Right side */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Fixed top bar */}
        <div className="shrink-0">
          <TopBar />
        </div>

        {/* Scrollable content */}
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-7">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-[26px] font-semibold tracking-tight text-primary">
                  Agents
                </h1>

                <p className="mt-1.5 text-[15px] leading-6 text-muted">
                  Models and tools OneAgent can call on.
                </p>
              </div>

              {!loading && !error && (
                <div className="flex items-center gap-2 self-start rounded-lg border border-border bg-card px-3.5 py-2.5 sm:self-auto">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      onlineAgents > 0
                        ? "bg-[#16A34A]"
                        : "bg-[#9CA3AF]"
                    }`}
                    aria-hidden="true"
                  />

                  <span className="text-[13px] font-medium text-primary">
                    {onlineAgents}{" "}
                    {onlineAgents === 1
                      ? "agent"
                      : "agents"}{" "}
                    available
                  </span>
                </div>
              )}
            </div>

            {/* Loading */}
            {loading ? (
              <div
                className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border bg-card"
                role="status"
                aria-live="polite"
              >
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-[#D97706]" />

                  <p className="text-[14px] font-medium text-primary">
                    Loading agents...
                  </p>

                  <p className="mt-1 text-[12px] text-faint">
                    Connecting to the OneAgent backend.
                  </p>
                </div>
              </div>
            ) : error ? (
              /* Error */
              <div
                className="flex flex-col gap-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                role="alert"
              >
                <div>
                  <p className="text-[15px] font-semibold text-[#B91C1C]">
                    Unable to load agents
                  </p>

                  <p className="mt-1.5 text-[13px] leading-5 text-[#B91C1C]/80">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void loadAgents()}
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#FECACA] bg-white px-3.5 py-2 text-[13px] font-medium text-[#B91C1C] transition-colors hover:bg-[#FFF7F7] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            ) : agents.length === 0 ? (
              /* Empty */
              <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border bg-card">
                <div className="text-center">
                  <p className="text-[15px] font-semibold text-primary">
                    No agents available
                  </p>

                  <p className="mt-1.5 text-[13px] text-faint">
                    OneAgent has not registered any agents yet.
                  </p>
                </div>
              </div>
            ) : (
              /* Agents */
              <AgentsGrid agents={agents} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}