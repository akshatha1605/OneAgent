"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    let cancelled = false;

    const loadAgents = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAgents();

        if (cancelled) {
          return;
        }

        const mappedAgents: Agent[] = data.map((agent, index) => ({
          id: agent.id ?? `agent-${index}`,
          name: agent.name ?? "Unnamed Agent",
          provider: agent.provider ?? "Unknown",
          type: agent.type === "tool" ? "tool" : "llm",
          status:
            agent.status === "online"
              ? "online"
              : agent.status === "offline"
                ? "offline"
                : "idle",
          description:
            agent.description ?? "No description provided.",
          capabilities: agent.capabilities ?? [],
          callsToday: agent.callsToday ?? 0,
        }));

        setAgents(mappedAgents);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load agents."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAgents();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main className="flex flex-1 flex-col gap-6 overflow-auto px-6 py-6">
          <div>
            <h1 className="text-[19px] font-semibold tracking-tight text-primary">
              Agents
            </h1>

            <p className="mt-0.5 text-[13px] text-muted">
              Models and tools OneAgent can call on.
            </p>
          </div>

          {loading ? (
            <div
              className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-border bg-card"
              role="status"
              aria-live="polite"
            >
              <p className="text-[13px] text-faint">
                Loading agents...
              </p>
            </div>
          ) : error ? (
            <div
              className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4"
              role="alert"
            >
              <p className="text-[13px] font-medium text-[#B91C1C]">
                Unable to load agents
              </p>
              <p className="mt-1 text-[12px] text-[#B91C1C]/80">
                {error}
              </p>
            </div>
          ) : (
            <AgentsGrid agents={agents} />
          )}
        </main>
      </div>
    </div>
  );
}