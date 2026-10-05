"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import PipelineVisualizer from "@/components/PipelineVisualizer";
import RunningAgents, {
  type RunningAgent,
} from "@/components/RunningAgents";
import {
  getOrchestrationStatus,
  getWorkflow,
} from "@/lib/api";

type WorkflowDetailPageProps = {
  params: {
    id: string;
  };
};

type WorkflowView = {
  id: string;
  title: string;
  description: string;
  status: "queued" | "running" | "completed" | "failed";
  activeStep: number;
  agentCount: number;
  elapsedTime: string;
  agents: RunningAgent[];
};

function normalizeStatus(status?: string): WorkflowView["status"] {
  switch (status) {
    case "running":
      return "running";

    case "done":
    case "completed":
      return "completed";

    case "failed":
      return "failed";

    case "queued":
      return "queued";

    default:
      return "queued";
  }
}

function mapWorkflow(
  workflow: Awaited<ReturnType<typeof getWorkflow>>,
  statusData?: Awaited<ReturnType<typeof getOrchestrationStatus>>
): WorkflowView {
  const status = normalizeStatus(
    statusData?.status ?? workflow.status
  );

  const tasks = workflow.tasks ?? [];

  const agents: RunningAgent[] = tasks.map((task, index) => ({
    id: `task-${index}`,
    name: task.name || `Task ${index + 1}`,
    task: task.name || `Task ${index + 1}`,
    progress:
      task.status === "completed"
        ? 100
        : task.status === "running"
        ? 50
        : 0,
    tone:
      task.status === "failed"
        ? "#DC2626"
        : "#D97706",
  }));

  const activeTaskIndex = tasks.findIndex(
    (task) => task.status === "running"
  );

  const firstTaskName = tasks[0]?.name;

  return {
    id: workflow.workflow_id,

    title:
      firstTaskName ||
      `Workflow ${workflow.workflow_id}`,

    description:
      tasks.length > 0
        ? `${tasks.length} task${
            tasks.length === 1 ? "" : "s"
          } in this workflow`
        : "Multi-step workflow execution",

    status,

    activeStep:
      activeTaskIndex >= 0
        ? activeTaskIndex
        : status === "completed"
        ? tasks.length
        : 0,

    agentCount: tasks.length,

    elapsedTime: "—",

    agents,
  };
}

export default function WorkflowDetailPage({
  params,
}: WorkflowDetailPageProps) {
  const { id } = params;

  const [workflow, setWorkflow] =
    useState<WorkflowView | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWorkflow = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const workflowData = await getWorkflow(id);

      let statusData:
        | Awaited<
            ReturnType<typeof getOrchestrationStatus>
          >
        | undefined;

      try {
        statusData =
          await getOrchestrationStatus(id);
      } catch {
        // Workflow details can still be displayed.
      }

      setWorkflow(
        mapWorkflow(
          workflowData,
          statusData
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load workflow."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadWorkflow();
  }, [loadWorkflow]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main className="flex flex-1 flex-col gap-7 overflow-auto px-4 py-6 sm:px-6 sm:py-7">
          <Link
            href="/workflows"
            className="inline-flex w-fit items-center gap-2 text-[13px] font-medium text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft
              size={15}
              aria-hidden="true"
            />
            Back to workflows
          </Link>

          {loading ? (
            <div
              className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-border bg-card"
              role="status"
              aria-live="polite"
            >
              <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-[#D97706]" />

                <p className="text-[14px] font-medium text-primary">
                  Loading workflow...
                </p>

                <p className="mt-1 text-[12px] text-faint">
                  Fetching workflow execution details.
                </p>
              </div>
            </div>
          ) : error ? (
            <div
              className="flex flex-col gap-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <div>
                <p className="text-[15px] font-semibold text-[#B91C1C]">
                  Unable to load workflow
                </p>

                <p className="mt-1.5 text-[13px] leading-5 text-[#B91C1C]/80">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadWorkflow()}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#FECACA] bg-white px-3.5 py-2 text-[13px] font-medium text-[#B91C1C] transition-colors hover:bg-[#FFF7F7] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          ) : workflow ? (
            <>
              <div>
                <h1 className="text-[26px] font-semibold tracking-tight text-primary">
                  {workflow.title}
                </h1>

                <p className="mt-1.5 text-[15px] leading-6 text-muted">
                  {workflow.description}
                </p>

                <div className="mt-3 inline-flex rounded-lg border border-border bg-card px-3 py-1.5">
                  <span className="font-mono text-[11px] text-faint">
                    ID: {workflow.id}
                  </span>
                </div>
              </div>

              <PipelineVisualizer
                activeStep={workflow.activeStep}
                status={workflow.status}
                title={workflow.title}
                agentCount={workflow.agentCount}
                elapsedTime={workflow.elapsedTime}
              />

              <RunningAgents
                agents={workflow.agents}
              />
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}