"use client";

import {
  ArrowUp,
  CheckCircle2,
  Code2,
  Compass,
  FileText,
  Image as ImageIcon,
  Loader2,
  PenLine,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  createWorkflow,
  executeWorkflow,
  getOrchestrationStatus,
  getTasks,
  type OrchestrationResponse,
  type TaskHistoryItem,
} from "@/lib/api";

type Capability = {
  label: string;
  description: string;
  icon: typeof Compass;
  prompt: string;
};

const capabilities: Capability[] = [
  {
    label: "Research",
    description: "Find and summarize information",
    icon: Compass,
    prompt: "Research this topic and give me a clear summary",
  },
  {
    label: "Coding",
    description: "Solve programming problems",
    icon: Code2,
    prompt: "Help me solve a programming problem",
  },
  {
    label: "Writing",
    description: "Create polished content",
    icon: PenLine,
    prompt: "Help me write something professionally",
  },
  {
    label: "Images",
    description: "Create visual content",
    icon: ImageIcon,
    prompt: "Help me create an image",
  },
  {
    label: "Documents",
    description: "Analyze or summarize files",
    icon: FileText,
    prompt: "Analyze or summarize a document",
  },
];

function extractResultText(
  response: OrchestrationResponse
): string {
  if (typeof response.result === "string") {
    return response.result;
  }

  if (!response.result) {
    return (
      response.message ??
      "The task was completed successfully."
    );
  }

  const result = response.result;

  if (typeof result.output === "string") {
    return result.output;
  }

  if (typeof result.result === "string") {
    return result.result;
  }

  if (typeof result.message === "string") {
    return result.message;
  }

  if (typeof result.error === "string") {
    return result.error;
  }

  return "The task was completed, but no readable output was returned.";
}

function formatActivityTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diff = Date.now() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}

function formatAgentName(agent?: string | null) {
  if (!agent) {
    return "OneAgent";
  }

  return agent
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function OneAgentWorkspace() {
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [workflowId, setWorkflowId] = useState<string | null>(
    null
  );

  const [orchestration, setOrchestration] =
    useState<OrchestrationResponse | null>(null);

  const [recentTasks, setRecentTasks] = useState<
    TaskHistoryItem[]
  >([]);

  const [activityLoading, setActivityLoading] =
    useState(true);

  const loadRecentTasks = useCallback(async () => {
    try {
      const response = await getTasks();
      setRecentTasks(response.tasks.slice(0, 4));
    } catch {
      setRecentTasks([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecentTasks();
  }, [loadRecentTasks]);

  const submitTask = async () => {
    const task = input.trim();

    if (!task || loading) {
      return;
    }

    setQuestion(task);
    setInput("");
    setAnswer("");
    setError("");
    setWorkflowId(null);
    setOrchestration(null);
    setLoading(true);

    try {
      /*
       * Step 1:
       * Create a real persistent workflow.
       */
      const workflow = await createWorkflow(task);

<<<<<<< HEAD
      setWorkflowId(workflow.workflow_id);
=======
      /*
       * The backend may return:
       *
       * result: "actual answer"
       *
       * OR:
       *
       * result: {
       *   agent_id: "...",
       *   agent_name: "...",
       *   status: "...",
       *   task: "...",
       *   result: "actual answer",
       *   metadata: {...}
       * }
       *
       * Extract the actual text before sending it to React.
       */

      const rawResult = response.result;

      let result: string;

      if (typeof rawResult === "string") {
        result = rawResult;
      } else if (
        rawResult &&
        typeof rawResult === "object" &&
        typeof rawResult.result === "string"
      ) {
        result = rawResult.result;
      } else if (response.message) {
        result = response.message;
      } else if (response.agent) {
        result = `Task routed to ${response.agent}.`;
      } else {
        result = "The task was received successfully.";
      }
>>>>>>> 9d5924dc5829cb2becf5c30b7fb66266f792c74f

      /*
       * Step 2:
       * Execute that workflow through the real
       * OneAgent backend orchestrator.
       */
      const execution = await executeWorkflow(
  workflow.workflow_id
);

if (execution.status === "failed") {
  setError(
    execution.message ||
      "OneAgent could not complete this task."
  );
  return;
}

const statusResponse =
  await getOrchestrationStatus(
    workflow.workflow_id
  );

if (statusResponse.status === "failed") {
  setError(
    statusResponse.error ||
      "OneAgent could not complete this task."
  );
  return;
}

if (statusResponse.result) {
  setAnswer(statusResponse.result);
} else {
  setAnswer(
    statusResponse.message ||
      "The task was completed successfully."
  );
}

setOrchestration({
  status: statusResponse.status,
  result: {
    output: statusResponse.result,
  },
});

      /*
       * Refresh activity so the newly completed
       * task immediately appears in the dashboard.
       */
      void loadRecentTasks();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while processing your task.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const selectCapability = (prompt: string) => {
    if (loading) {
      return;
    }

    setInput(prompt);
    setError("");
  };

  const startNewTask = () => {
    if (loading) {
      return;
    }

    setQuestion("");
    setAnswer("");
    setError("");
    setInput("");
    setWorkflowId(null);
    setOrchestration(null);
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      {/* Hero */}
      {!question ? (
        <div className="pt-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <Sparkles
              size={21}
              strokeWidth={1.8}
              className="text-[#D97706]"
            />
          </div>

          <h1 className="text-[34px] font-semibold tracking-[-0.025em] text-primary">
            What can I help you accomplish?
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-[16px] leading-7 text-muted">
            Tell OneAgent what you need. It will analyze your task,
            choose the right agent, and handle the work for you.
          </p>
        </div>
      ) : (
        <div className="pt-4">
          <button
            type="button"
            onClick={startNewTask}
            disabled={loading}
            className="text-[13px] font-medium text-[#D97706] transition-colors hover:text-[#B45309] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← New task
          </button>
        </div>
      )}

      {/* Main composer */}
      <div className="mx-auto w-full max-w-4xl">
        <div
          className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-all ${
            loading
              ? "border-border"
              : "border-border focus-within:border-[#D97706]/60 focus-within:shadow-[0_0_0_3px_rgba(217,119,6,0.06)]"
          }`}
        >
          <textarea
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                void submitTask();
              }
            }}
            disabled={loading}
            rows={3}
            placeholder="Ask OneAgent to research, write, code, analyze..."
            aria-label="Task for OneAgent"
            className="block w-full resize-none border-0 bg-transparent px-5 pt-5 text-[16px] leading-7 text-primary outline-none placeholder:text-faint disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="flex items-center justify-between px-3 pb-3 pt-2">
            <div className="pl-2 text-[13px] text-faint">
              {loading
                ? "OneAgent is working on your task..."
                : "Enter to send · Shift + Enter for a new line"}
            </div>

            <button
              type="button"
              onClick={() => void submitTask()}
              disabled={!input.trim() || loading}
              aria-label={
                loading
                  ? "Processing task"
                  : "Send task"
              }
              title={
                loading
                  ? "Processing task"
                  : "Send task"
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-25"
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <ArrowUp
                  size={19}
                  strokeWidth={2.2}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      {!question && (
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-3">
            <div className="text-[14px] font-semibold text-primary">
              What can OneAgent do?
            </div>

            <div className="mt-0.5 text-[13px] text-faint">
              Start with a capability or describe your own task.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {capabilities.map((capability) => {
              const Icon = capability.icon;

              return (
                <button
                  key={capability.label}
                  type="button"
                  onClick={() =>
                    selectCapability(
                      capability.prompt
                    )
                  }
                  disabled={loading}
                  className="group min-h-[112px] rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#D97706]/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF7ED]">
                    <Icon
                      size={17}
                      strokeWidth={1.9}
                      className="text-[#D97706]"
                    />
                  </div>

                  <div className="mt-3 text-[14px] font-semibold text-primary">
                    {capability.label}
                  </div>

                  <div className="mt-1 text-[12px] leading-5 text-faint">
                    {capability.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation / Result */}
      {question && (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
          {/* User task */}
          <div className="flex justify-end">
            <div className="max-w-[82%] rounded-2xl rounded-br-md bg-primary px-5 py-3.5 text-[15px] leading-6 text-white shadow-sm">
              {question}
            </div>
          </div>

          {/* OneAgent */}
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Sparkles size={17} />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[14px] font-semibold text-primary">
                  OneAgent
                </span>

                {loading && (
                  <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[11px] font-medium text-[#B45309]">
                    Working
                  </span>
                )}

                {!loading &&
                  !error &&
                  answer && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-[#15803D]">
                      <CheckCircle2 size={12} />
                      Completed
                    </span>
                  )}
              </div>

              {loading ? (
                <div
                  className="rounded-xl border border-border bg-card px-5 py-5"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97706]" />

                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97706]"
                        style={{
                          animationDelay: "100ms",
                        }}
                      />

                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97706]"
                        style={{
                          animationDelay: "200ms",
                        }}
                      />
                    </div>

                    <span className="text-[14px] text-muted">
                      Creating workflow and executing the best
                      agent...
                    </span>
                  </div>
                </div>
              ) : error ? (
                <div
                  className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-[15px] leading-6 text-[#B91C1C]"
                  role="alert"
                >
                  {error}

                  {workflowId && (
                    <Link
                      href={`/workflows/${workflowId}`}
                      className="mt-3 block text-[13px] font-medium underline"
                    >
                      View workflow
                    </Link>
                  )}
                </div>
              ) : (
<<<<<<< HEAD
                <>
                  <div className="rounded-xl border border-border bg-card px-5 py-5 text-[15px] leading-7 text-[#374151] shadow-sm whitespace-pre-wrap">
                    {answer}
                  </div>

                  {orchestration && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {orchestration.selected_agent?.name && (
                        <MetadataBadge
                          label="Agent"
                          value={
                            orchestration
                              .selected_agent.name
                          }
                        />
                      )}

                      {orchestration.model?.selected && (
                        <MetadataBadge
                          label="Model"
                          value={
                            orchestration.model.selected
                          }
                        />
                      )}

                      {orchestration.search?.used && (
                        <MetadataBadge
                          label="Search"
                          value={
                            orchestration.search
                              .provider ??
                            "Enabled"
                          }
                        />
                      )}

                      {typeof orchestration
                        .routing?.confidence ===
                        "number" && (
                        <MetadataBadge
                          label="Confidence"
                          value={`${Math.round(
                            orchestration.routing
                              .confidence * 100
                          )}%`}
                        />
                      )}

                      {orchestration.model
                        ?.fallback_used && (
                        <MetadataBadge
                          label="Fallback"
                          value="Used"
                        />
                      )}

                      {workflowId && (
                        <Link
                          href={`/workflows/${workflowId}`}
                          className="rounded-md border border-[#D97706]/30 bg-[#FFFBF5] px-3 py-1.5 text-[12px] font-medium text-[#B45309] hover:bg-[#FFF7ED]"
                        >
                          View workflow
                        </Link>
                      )}
                    </div>
                  )}
                </>
=======
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-[13.5px] leading-relaxed text-[#374151] whitespace-pre-wrap">
                  {answer}
                </div>
>>>>>>> 9d5924dc5829cb2becf5c30b7fb66266f792c74f
              )}
            </div>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={startNewTask}
              className="self-start rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] font-medium text-muted transition-colors hover:border-[#D97706]/40 hover:bg-[#FFFBF5] hover:text-primary"
            >
              + Start a new task
            </button>
          )}
        </div>
      )}

      {/* Overview cards */}
      {!question && (
        <div className="mx-auto w-full max-w-4xl">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <OverviewCard
              icon={<Zap size={17} />}
              title="Smart routing"
              description="Tasks are analyzed and routed to the most suitable agent."
            />

            <OverviewCard
              icon={<Sparkles size={17} />}
              title="Multi-model execution"
              description="OneAgent can select and fall back between available AI models."
            />

            <OverviewCard
              icon={<CheckCircle2 size={17} />}
              title="Execution history"
              description="Completed tasks and routing details are saved for later review."
            />
          </div>
        </div>
      )}

      {/* Recent activity */}
      {!question && (
        <div className="mx-auto w-full max-w-4xl pb-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="text-[14px] font-semibold text-primary">
                Recent activity
              </div>

              <div className="mt-0.5 text-[13px] text-faint">
                Your latest OneAgent executions.
              </div>
            </div>

            <Link
              href="/history"
              className="text-[13px] font-medium text-[#D97706] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {activityLoading ? (
              <div className="px-5 py-6 text-[13px] text-faint">
                Loading recent activity...
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF7ED]">
                  <Sparkles
                    size={17}
                    className="text-[#D97706]"
                  />
                </div>

                <div className="mt-3 text-[14px] font-medium text-primary">
                  No recent tasks
                </div>

                <div className="mt-1 text-[13px] text-faint">
                  Run your first task above and it will appear here.
                </div>
              </div>
            ) : (
              recentTasks.map((task) => (
                <ActivityItem
                  key={task.id}
                  title={task.task}
                  detail={`${formatAgentName(
                    task.agent
                  )}${
                    task.model
                      ? ` · ${task.model}`
                      : ""
                  }`}
                  time={formatActivityTime(
                    task.created_at
                  )}
                  status={task.status}
                />
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function MetadataBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] text-faint">
      <span className="text-muted">{label}:</span>{" "}
      <span className="font-medium text-primary">
        {value}
      </span>
    </span>
  );
}

function OverviewCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF7ED] text-[#D97706]">
        {icon}
      </div>

      <div className="mt-3 text-[14px] font-semibold text-primary">
        {title}
      </div>

      <div className="mt-1 text-[12px] leading-5 text-faint">
        {description}
      </div>
    </div>
  );
}

function ActivityItem({
  title,
  detail,
  time,
  status,
}: {
  title: string;
  detail: string;
  time: string;
  status: string;
}) {
  const failed = status === "failed";

  return (
    <div className="flex items-center gap-3 border-b border-[#F0F0EE] px-5 py-4 last:border-b-0">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          failed
            ? "bg-[#DC2626]"
            : "bg-[#16A34A]"
        }`}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium text-primary">
          {title}
        </div>

        <div className="mt-0.5 text-[12px] text-faint">
          {detail}
        </div>
      </div>

<<<<<<< HEAD
      <div className="ml-3 shrink-0 text-[12px] text-faint">
=======
      <div className="ml-4 shrink-0 text-[10.5px] text-faint">
>>>>>>> 9d5924dc5829cb2becf5c30b7fb66266f792c74f
        {time}
      </div>
    </div>
  );
}