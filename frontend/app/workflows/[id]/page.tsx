"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import PipelineVisualizer from "@/components/PipelineVisualizer";
import RunningAgents, {
  type RunningAgent,
} from "@/components/RunningAgents";
import {
  getOrchestrationStatus,
  getWorkflow,
  type BackendWorkflow,
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

function normalizeStatus(
  status?: string
): WorkflowView["status"] {
  switch (status) {
    case "running":
      return "running";
    case "done":
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    default:
      return "queued";
  }
}

function mapWorkflow(
  workflow: BackendWorkflow,
  statusData?: Awaited<ReturnType<typeof getOrchestrationStatus>>
): WorkflowView {
  const status = normalizeStatus(
    statusData?.status ?? workflow.status
  );

  const backendAgents =
    statusData?.agents ?? [];

  const agents: RunningAgent[] = backendAgents.map(
    (agent, index) => ({
      id: agent.id ?? `agent-${index}`,
      name: agent.name ?? "Unnamed Agent",
      task: agent.description ?? "Processing workflow",
      progress:
        status === "completed"
          ? 100
          : status === "failed"
            ? 0
            : statusData?.progress ?? 0,
      tone: status === "failed" ? "#DC2626" : "#D97706",
    })
  );

  return {
    id: workflow.id,
    title: workflow.title ?? "Untitled workflow",
    description:
      workflow.description ?? "No description provided.",
    status,
    activeStep:
      statusData?.activeStep ??
      statusData?.active_step ??
      0,
    agentCount:
      backendAgents.length ||
      workflow.agents?.length ||
      0,
    elapsedTime: workflow.duration ?? "—",
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

  useEffect(() => {
    let cancelled = false;

    const loadWorkflow = async () => {
      try {
        setLoading(true);
        setError("");

        const workflowData = await getWorkflow(id);

        if (cancelled) {
          return;
        }

        let statusData:
          | Awaited<ReturnType<typeof getOrchestrationStatus>>
          | undefined;

        try {
          statusData = await getOrchestrationStatus(id);
        } catch {
          // The workflow endpoint is still enough to display
          // the basic workflow details.
        }

        if (cancelled) {
          return;
        }

        setWorkflow(mapWorkflow(workflowData, statusData));
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load workflow."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadWorkflow();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main className="flex flex-1 flex-col gap-6 overflow-auto px-6 py-6">
          <div>
            <Link
              href="/workflows"
              className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-primary"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to workflows
            </Link>

            {loading ? (
              <div
                className="flex min-h-[100px] items-center justify-center rounded-xl border border-dashed border-border bg-card"
                role="status"
                aria-live="polite"
              >
                <p className="text-[13px] text-faint">
                  Loading workflow...
                </p>
              </div>
            ) : error ? (
              <div
                className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4"
                role="alert"
              >
                <p className="text-[13px] font-medium text-[#B91C1C]">
                  Unable to load workflow
                </p>

                <p className="mt-1 text-[12px] text-[#B91C1C]/80">
                  {error}
                </p>
              </div>
            ) : workflow ? (
              <>
                <div className="flex flex-col gap-1">
                  <h1 className="text-[19px] font-semibold tracking-tight text-primary">
                    {workflow.title}
                  </h1>

                  <p className="text-[13px] text-muted">
                    {workflow.description}
                  </p>

                  <p className="mt-1 font-mono text-[10.5px] text-faint">
                    Workflow ID: {workflow.id}
                  </p>
                </div>

                <div className="mt-6">
                  <PipelineVisualizer
                    activeStep={workflow.activeStep}
                    status={workflow.status}
                    title={workflow.title}
                    agentCount={workflow.agentCount}
                    elapsedTime={workflow.elapsedTime}
                  />
                </div>

                <div className="mt-6">
                  <RunningAgents
                    agents={workflow.agents}
                  />
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}