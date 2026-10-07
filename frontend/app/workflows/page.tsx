"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  RefreshCw,
  Workflow as WorkflowIcon,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import WorkflowsList, {
  type Workflow,
} from "@/components/WorkflowsList";
import {
  addWorkflowStep,
  createWorkflow,
  getWorkflows,
} from "@/lib/api";

const AGENT_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "research", label: "Research" },
  { value: "coding", label: "Coding" },
  { value: "writing", label: "Writing" },
  { value: "document", label: "Document" },
] as const;

type WorkflowStepDraft = {
  instruction: string;
  agentId: (typeof AGENT_OPTIONS)[number]["value"];
};

function formatWorkflowTime(createdAt?: string): string {
  if (!createdAt) {
    return "Unknown";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function normalizeStatus(
  status?: string
): Workflow["status"] {
  switch (status) {
    case "running":
      return "running";

    case "failed":
      return "failed";

    case "completed":
    case "done":
      return "done";

    case "queued":
    case "pending":
    default:
      return "queued";
  }
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [workflowTitle, setWorkflowTitle] = useState("");
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepDraft[]>([
    { instruction: "", agentId: "auto" },
  ]);
  const [creating, setCreating] = useState(false);
  const [validationError, setValidationError] = useState("");

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getWorkflows();

      const mappedWorkflows: Workflow[] = data.workflows.map(
        (workflow) => ({
          id: workflow.workflow_id,

          title:
            workflow.task?.trim() ||
            "Untitled workflow",

          description:
            workflow.task?.trim() ||
            "No description provided.",

          status: normalizeStatus(
            workflow.status
          ),

          agents: ["OneAgent"],
          stepCount: workflow.step_count ?? 0,

          createdAt: formatWorkflowTime(
            workflow.created_at
          ),

          updatedAt: formatWorkflowTime(
            workflow.updated_at
          ),

          duration: "—",

          progress:
            workflow.status === "running"
              ? 50
              : workflow.status === "completed" ||
                  workflow.status === "done"
                ? 100
                : undefined,
        })
      );

      setWorkflows(mappedWorkflows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load workflows."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleCreate = async () => {
    const title = workflowTitle.trim();
    const steps = workflowSteps.map((step) => ({
      instruction: step.instruction.trim(),
      agentId: step.agentId,
    }));

    if (!title) {
      setValidationError("Workflow name is required.");
      return;
    }

    if (steps.length === 0) {
      setValidationError("Add at least one workflow step.");
      return;
    }

    if (steps.some((step) => !step.instruction)) {
      setValidationError(
        "Each step needs an instruction. Remove blank lines and try again."
      );
      return;
    }

    try {
      setCreating(true);
      setError("");
      setValidationError("");
      const workflow = await createWorkflow(title);
      for (const [index, step] of steps.entries()) {
        await addWorkflowStep(
          workflow.workflow_id,
          step.instruction,
          index + 1,
          step.agentId
        );
      }
      setWorkflowTitle("");
      setWorkflowSteps([{ instruction: "", agentId: "auto" }]);
      setShowCreate(false);
      router.push(`/workflows/${workflow.workflow_id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create workflow."
      );
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    void loadWorkflows();
  }, [loadWorkflows]);

  const runningCount = workflows.filter(
    (workflow) => workflow.status === "running"
  ).length;

  const completedCount = workflows.filter(
    (workflow) => workflow.status === "done"
  ).length;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main className="flex flex-1 flex-col gap-8 overflow-auto px-4 py-6 sm:px-6 sm:py-7">
          {/* Header */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#D97706]">
                  <WorkflowIcon
                    size={20}
                    strokeWidth={1.8}
                  />
                </div>

                <h1 className="text-[27px] font-semibold tracking-tight text-primary">
                  Workflows
                </h1>
              </div>

              <p className="mt-2 text-[15px] leading-6 text-muted">
                Every workflow OneAgent has run,
                is running, or has queued.
              </p>
            </div>

            {!loading && !error && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate((value) => !value)}
                  className="rounded-xl bg-primary px-4 py-2.5 text-[13px] font-medium text-white"
                >
                  {showCreate ? "Cancel" : "Create workflow"}
                </button>
                <SummaryBadge
                  label="Total"
                  value={workflows.length}
                />

                <SummaryBadge
                  label="Running"
                  value={runningCount}
                  active={runningCount > 0}
                />

                <SummaryBadge
                  label="Completed"
                  value={completedCount}
                />
              </div>
            )}

          {showCreate && (
            <div className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="text-[17px] font-semibold text-primary">
                    Create workflow
                  </h2>
                  <p className="mt-1 text-[13px] text-muted">
                    Add steps below, choose an agent, and reorder them before saving.
                  </p>
                  <input
                    value={workflowTitle}
                    onChange={(event) => setWorkflowTitle(event.target.value)}
                    aria-label="Workflow name"
                    placeholder="Workflow name"
                    className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-primary outline-none focus:border-accent"
                  />
                  <div className="mt-4 space-y-3">
                    {workflowSteps.map((step, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-border bg-background p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <label
                            htmlFor={`workflow-step-${index}`}
                            className="text-[12px] font-semibold text-muted"
                          >
                            Step {index + 1}
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setWorkflowSteps((current) => {
                                  if (index === 0) return current;
                                  const next = [...current];
                                  [next[index - 1], next[index]] = [
                                    next[index],
                                    next[index - 1],
                                  ];
                                  return next;
                                })
                              }
                              disabled={index === 0}
                              className="rounded px-2 py-1 text-[12px] text-muted disabled:opacity-30"
                              aria-label={`Move step ${index + 1} up`}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setWorkflowSteps((current) => {
                                  if (index === current.length - 1) return current;
                                  const next = [...current];
                                  [next[index], next[index + 1]] = [
                                    next[index + 1],
                                    next[index],
                                  ];
                                  return next;
                                })
                              }
                              disabled={index === workflowSteps.length - 1}
                              className="rounded px-2 py-1 text-[12px] text-muted disabled:opacity-30"
                              aria-label={`Move step ${index + 1} down`}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setWorkflowSteps((current) =>
                                  current.length === 1
                                    ? current
                                    : current.filter((_, item) => item !== index)
                                )
                              }
                              disabled={workflowSteps.length === 1}
                              className="rounded px-2 py-1 text-[12px] text-[#B91C1C] disabled:opacity-30"
                              aria-label={`Remove step ${index + 1}`}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <textarea
                          id={`workflow-step-${index}`}
                          value={step.instruction}
                          onChange={(event) =>
                            setWorkflowSteps((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, instruction: event.target.value }
                                  : item
                              )
                            )
                          }
                          placeholder="Step instruction"
                          rows={2}
                          className="mt-2 w-full resize-y rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] leading-6 text-primary outline-none focus:border-accent"
                        />
                        <label className="mt-2 flex items-center gap-2 text-[12px] text-muted">
                          Agent
                          <select
                            value={step.agentId}
                            onChange={(event) =>
                              setWorkflowSteps((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        agentId: event.target
                                          .value as WorkflowStepDraft["agentId"],
                                      }
                                    : item
                                )
                              )
                            }
                            className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] text-primary outline-none focus:border-accent"
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
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setWorkflowSteps((current) => [
                        ...current,
                        { instruction: "", agentId: "auto" },
                      ])
                    }
                    className="mt-3 rounded-lg border border-border px-3 py-2 text-[13px] font-medium text-primary"
                  >
                    Add step
                  </button>
                  {validationError && (
                    <p className="mt-2 text-[13px] text-[#B91C1C]" role="alert">
                      {validationError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleCreate()}
                    disabled={creating}
                    className="mt-3 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Save workflow"}
                  </button>
            </div>
          )}
          </div>

          {/* Loading */}
          {loading ? (
            <div
              className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-border bg-card"
              role="status"
              aria-live="polite"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7ED]">
                  <Activity
                    size={21}
                    className="animate-pulse text-[#D97706]"
                  />
                </div>

                <p className="text-[15px] font-semibold text-primary">
                  Loading workflows...
                </p>

                <p className="mt-1.5 text-[13px] text-faint">
                  Connecting to the OneAgent backend.
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
                  Unable to load workflows
                </p>

                <p className="mt-1.5 text-[13px] leading-5 text-[#B91C1C]/80">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadWorkflows()}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#FECACA] bg-white px-3.5 py-2 text-[13px] font-medium text-[#B91C1C] transition-colors hover:bg-[#FFF7F7] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          ) : (
            <WorkflowsList workflows={workflows} />
          )}
        </main>
      </div>
    </div>
  );
}

function SummaryBadge({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5">
      <span
        className={`h-2 w-2 rounded-full ${
          active
            ? "bg-[#D97706]"
            : "bg-[#9CA3AF]"
        }`}
        aria-hidden="true"
      />

      <span className="text-[12px] text-muted">
        {label}
      </span>

      <span className="text-[14px] font-semibold text-primary">
        {value}
      </span>
    </div>
  );
}