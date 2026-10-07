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
import MarkdownRenderer from "@/components/MarkdownRenderer";
import {
  deleteWorkflowStep,
  executeWorkflow,
  getOrchestrationStatus,
  getWorkflow,
  updateWorkflowStep,
} from "@/lib/api";

type WorkflowDetailPageProps = {
  params: {
    id: string;
  };
};

const AGENT_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "research", label: "Research" },
  { value: "coding", label: "Coding" },
  { value: "writing", label: "Writing" },
  { value: "document", label: "Document" },
] as const;

type StepDraft = {
  id: number;
  name: string;
  agentId: (typeof AGENT_OPTIONS)[number]["value"];
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
  tasks: Awaited<ReturnType<typeof getWorkflow>>["tasks"];
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

  const agents: RunningAgent[] = tasks
    .filter((task) => task.status === "running")
    .map((task, index) => ({
    id: `task-${index}`,
    name: task.name || `Task ${index + 1}`,
    task: task.name || `Task ${index + 1}`,
    progress: 50,
    tone: "#D97706",
  }));

  const activeTaskIndex = tasks.findIndex(
    (task) => task.status === "running"
  );

  return {
    id: workflow.workflow_id,

    title: workflow.task?.trim() || `Workflow ${workflow.workflow_id}`,

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
    tasks,
  };
}

function extractResult(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Record<string, unknown>;
  for (const key of ["result", "output", "message", "error"]) {
    const extracted = extractResult(record[key]);
    if (extracted) {
      return extracted;
    }
  }

  return "";
}

export default function WorkflowDetailPage({
  params,
}: WorkflowDetailPageProps) {
  const { id } = params;

  const [workflow, setWorkflow] =
    useState<WorkflowView | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [executing, setExecuting] = useState(false);
  const [executionState, setExecutionState] = useState<
    "idle" | "executing" | "completed" | "failed"
  >("idle");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<StepDraft[]>([]);

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
      setExecutionState(
        workflowData.status === "failed"
          ? "failed"
          : workflowData.status === "completed"
          ? "completed"
          : "idle"
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

  const runWorkflow = async () => {
    try {
      setExecuting(true);
      setExecutionState("executing");
      setError("");
      setWorkflow((current) =>
        current
          ? {
              ...current,
              status: "running",
              activeStep: 0,
              tasks: current.tasks.map((task, index) => ({
                ...task,
                status: index === 0 ? "running" : "queued",
              })),
            }
          : current
      );
      await executeWorkflow(id);
      await loadWorkflow();
    } catch (err) {
      setExecutionState("failed");
      setError(
        err instanceof Error
          ? err.message
          : "Unable to execute workflow."
      );
    } finally {
      setExecuting(false);
    }
  };

  const startEditing = () => {
    setDrafts(
      (workflow?.tasks ?? []).flatMap((task) =>
        task.id === undefined
          ? []
          : [{
              id: task.id,
              name: task.name,
              agentId:
                (task.agent_id as StepDraft["agentId"] | null) ?? "auto",
            }]
      )
    );
    setEditing(true);
    setError("");
  };

  const cancelEditing = () => {
    setEditing(false);
    setDrafts([]);
  };

  const saveEditing = async () => {
    if (drafts.length === 0 || drafts.some((draft) => !draft.name.trim())) {
      setError("Every workflow step needs an instruction.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      // Temporary unique orders make arbitrary reordering safe across
      // one-step-at-a-time API updates.
      for (const [index, draft] of drafts.entries()) {
        await updateWorkflowStep(id, draft.id, {
          name: draft.name.trim(),
          step_order: 1000 + index,
          agent_id: draft.agentId,
        });
      }
      for (const [index, draft] of drafts.entries()) {
        await updateWorkflowStep(id, draft.id, {
          name: draft.name.trim(),
          step_order: index + 1,
          agent_id: draft.agentId,
        });
      }
      setEditing(false);
      setDrafts([]);
      await loadWorkflow();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save workflow steps.");
    } finally {
      setSaving(false);
    }
  };

  const removeStep = async (stepId: number) => {
    try {
      setSaving(true);
      setError("");
      await deleteWorkflowStep(id, stepId);
      await loadWorkflow();
      setDrafts((current) => current.filter((draft) => draft.id !== stepId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete workflow step.");
    } finally {
      setSaving(false);
    }
  };

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

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void runWorkflow()}
                    disabled={executing || editing || workflow.tasks.length === 0}
                  className={`mt-4 rounded-lg px-4 py-2 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                    executionState === "failed"
                      ? "bg-[#B91C1C]"
                      : executionState === "completed"
                      ? "bg-[#15803D]"
                      : "bg-primary"
                  }`}
                  >
                    {executionState === "executing"
                      ? "Executing workflow..."
                      : executionState === "completed"
                      ? "Workflow completed · Run again"
                      : executionState === "failed"
                      ? "Workflow failed · Retry"
                      : "Execute workflow"}
                  </button>
                  {!editing ? (
                    <button
                      type="button"
                      onClick={startEditing}
                      disabled={executing}
                      className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium text-primary disabled:opacity-50"
                    >
                      Edit steps
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void saveEditing()}
                        disabled={saving}
                        className="mt-4 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                        className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium text-primary disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
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

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-[17px] font-semibold text-primary">
                  Workflow steps
                </h2>

                <div className="mt-4 space-y-3">
                  {workflow.tasks.length === 0 ? (
                    <p className="text-[14px] text-muted">
                      No steps defined yet.
                    </p>
                  ) : (
                    editing
                      ? drafts.map((draft, index) => (
                          <div
                            key={draft.id}
                            className="rounded-xl border border-border bg-background p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[12px] font-semibold text-muted">
                                Step {index + 1}
                              </p>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={index === 0 || saving}
                                  onClick={() =>
                                    setDrafts((current) => {
                                      const next = [...current];
                                      [next[index - 1], next[index]] = [
                                        next[index],
                                        next[index - 1],
                                      ];
                                      return next;
                                    })
                                  }
                                  className="px-2 py-1 text-[12px] text-muted disabled:opacity-30"
                                  aria-label={`Move step ${index + 1} up`}
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={index === drafts.length - 1 || saving}
                                  onClick={() =>
                                    setDrafts((current) => {
                                      const next = [...current];
                                      [next[index], next[index + 1]] = [
                                        next[index + 1],
                                        next[index],
                                      ];
                                      return next;
                                    })
                                  }
                                  className="px-2 py-1 text-[12px] text-muted disabled:opacity-30"
                                  aria-label={`Move step ${index + 1} down`}
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void removeStep(draft.id)}
                                  className="px-2 py-1 text-[12px] text-[#B91C1C] disabled:opacity-30"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={draft.name}
                              onChange={(event) =>
                                setDrafts((current) =>
                                  current.map((item) =>
                                    item.id === draft.id
                                      ? { ...item, name: event.target.value }
                                      : item
                                  )
                                )
                              }
                              className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] text-primary outline-none focus:border-accent"
                              rows={2}
                              aria-label={`Instruction for step ${index + 1}`}
                            />
                            <label className="mt-2 flex items-center gap-2 text-[12px] text-muted">
                              Agent
                              <select
                                value={draft.agentId}
                                onChange={(event) =>
                                  setDrafts((current) =>
                                    current.map((item) =>
                                      item.id === draft.id
                                        ? {
                                            ...item,
                                            agentId: event.target
                                              .value as StepDraft["agentId"],
                                          }
                                        : item
                                    )
                                  )
                                }
                                className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] text-primary"
                                aria-label={`Agent for step ${index + 1}`}
                              >
                                {AGENT_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        ))
                      : workflow.tasks.map((task, index) => (
                      <div key={task.id}>
                        <div className="rounded-xl border border-border bg-background p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[14px] font-medium text-primary">
                              {task.step_order}. {task.name}
                            </p>
                            <span className={`text-[12px] font-medium ${
                              task.status === "failed"
                                ? "text-[#B91C1C]"
                                : task.status === "blocked"
                                ? "text-muted"
                                : task.status === "completed"
                                ? "text-[#15803D]"
                                : task.status === "running"
                                ? "text-[#B45309]"
                                : "text-muted"
                            }`}>
                              {task.status === "completed"
                                ? "✓ Completed"
                                : task.status === "failed"
                                ? "✕ Failed"
                                : task.status === "blocked"
                                ? "⏸ Blocked"
                                : task.status === "running"
                                ? "● Running"
                                : "○ Waiting"}
                            </span>
                          </div>

                          <p className="mt-2 text-[12px] text-faint">
                            Configured: {task.agent_id ?? "Auto"}
                            {task.selected_agent
                              ? ` · Executed: ${task.selected_agent}`
                              : ""}
                            {task.model ? ` · Model: ${task.model}` : ""}
                          </p>

                          {(task.selected_agent || task.model) && (
                            <p className="mt-2 text-[12px] text-faint">
                              Task ID: {task.task_id ?? "Not executed"}
                            </p>
                          )}

                          {task.error && (
                            <p className="mt-2 text-[13px] text-[#B91C1C]">
                              {task.error}
                            </p>
                          )}

                          {extractResult(task.result) && (
                            <div className="mt-3 min-w-0 overflow-hidden rounded-lg border border-border bg-card p-3 text-[14px] leading-7 text-[#374151] sm:p-4">
                              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-faint">
                                Result
                              </p>
                              <div className="min-w-0 overflow-hidden">
                                <MarkdownRenderer
                                  content={extractResult(task.result)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        {index < workflow.tasks.length - 1 && (
                          <div className="py-2 text-center text-lg text-faint" aria-hidden="true">
                            ↓
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}