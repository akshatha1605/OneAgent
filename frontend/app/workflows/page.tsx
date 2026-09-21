"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import WorkflowsList, {
  type Workflow,
} from "@/components/WorkflowsList";
import { getWorkflows } from "@/lib/api";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadWorkflows = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getWorkflows();

        if (cancelled) {
          return;
        }

        const mappedWorkflows: Workflow[] = data.map(
          (workflow, index) => ({
            id: workflow.id ?? `workflow-${index}`,
            title: workflow.title ?? "Untitled workflow",
            description:
              workflow.description ?? "No description provided.",
            status:
              workflow.status === "running"
                ? "running"
                : workflow.status === "failed"
                  ? "failed"
                  : workflow.status === "done"
                    ? "done"
                    : "queued",
            agents: workflow.agents ?? [],
            createdAt: workflow.createdAt ?? "Unknown",
            duration: workflow.duration ?? "—",
            progress: workflow.progress,
          })
        );

        setWorkflows(mappedWorkflows);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load workflows."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadWorkflows();

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
              Workflows
            </h1>

            <p className="mt-0.5 text-[13px] text-muted">
              Every workflow OneAgent has run, is running, or has
              queued.
            </p>
          </div>

          {loading ? (
            <div
              className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-border bg-card"
              role="status"
              aria-live="polite"
            >
              <p className="text-[13px] text-faint">
                Loading workflows...
              </p>
            </div>
          ) : error ? (
            <div
              className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4"
              role="alert"
            >
              <p className="text-[13px] font-medium text-[#B91C1C]">
                Unable to load workflows
              </p>

              <p className="mt-1 text-[12px] text-[#B91C1C]/80">
                {error}
              </p>
            </div>
          ) : (
            <WorkflowsList workflows={workflows} />
          )}
        </main>
      </div>
    </div>
  );
}