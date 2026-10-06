"use client";

import {
  Compass,
  Code2,
  PenLine,
  Image as ImageIcon,
  FileText,
  ArrowUp,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { orchestrateTask } from "@/lib/api";

type Capability = {
  label: string;
  icon: typeof Compass;
  prompt: string;
};

const capabilities: Capability[] = [
  {
    label: "Research",
    icon: Compass,
    prompt: "Research this topic and give me a clear summary",
  },
  {
    label: "Coding",
    icon: Code2,
    prompt: "Help me solve a programming problem",
  },
  {
    label: "Writing",
    icon: PenLine,
    prompt: "Help me write something professionally",
  },
  {
    label: "Images",
    icon: ImageIcon,
    prompt: "Help me create an image",
  },
  {
    label: "Documents",
    icon: FileText,
    prompt: "Analyze or summarize a document",
  },
];

export default function OneAgentWorkspace() {
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitTask = async () => {
    const task = input.trim();

    if (!task || loading) {
      return;
    }

    setQuestion(task);
    setInput("");
    setAnswer("");
    setError("");
    setLoading(true);

    try {
      const response = await orchestrateTask(task);

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

      setAnswer(result);
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
  };

  return (
    <section className="flex flex-col gap-8">
      {/* Hero */}
      <div className="pt-8 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight text-primary">
          What can I help you accomplish?
        </h1>

        <p className="mt-2 text-[14px] text-muted">
          Tell OneAgent what you need. It will figure out the best way to
          handle it.
        </p>
      </div>

      {/* Main input */}
      <div className="mx-auto w-full max-w-3xl">
        <div
          className={`rounded-2xl border bg-card p-2 shadow-sm transition-colors ${
            loading
              ? "border-border"
              : "border-border focus-within:border-[#D97706]"
          }`}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submitTask();
                }
              }}
              disabled={loading}
              rows={2}
              placeholder="Ask OneAgent to research, write, code, analyze..."
              aria-label="Task for OneAgent"
              className="flex-1 resize-none border-0 bg-transparent px-3 py-3 text-[14px] text-primary outline-none placeholder:text-faint disabled:cursor-not-allowed disabled:opacity-60"
            />

            <button
              type="button"
              onClick={() => void submitTask()}
              disabled={!input.trim() || loading}
              aria-label={loading ? "Processing task" : "Send task"}
              title={loading ? "Processing task" : "Send task"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className="mt-2 text-center text-[11px] text-faint">
          Press Enter to send · Shift + Enter for a new line
        </div>
      </div>

      {/* Capabilities */}
      {!question && (
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-3 text-[12px] font-semibold text-primary">
            Try OneAgent for
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {capabilities.map((capability) => {
              const Icon = capability.icon;

              return (
                <button
                  key={capability.label}
                  type="button"
                  onClick={() => selectCapability(capability.prompt)}
                  disabled={loading}
                  className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-[12px] font-medium text-[#374151] transition-all hover:border-[#D97706]/40 hover:bg-[#FFFBF5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon
                    size={18}
                    strokeWidth={1.9}
                    className="text-[#D97706] transition-transform group-hover:scale-105"
                  />

                  {capability.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation */}
      {question && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-[13.5px] leading-relaxed text-white">
              {question}
            </div>
          </div>

          {/* OneAgent response */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <Sparkles size={15} />
            </div>

            <div className="flex-1 pt-1">
              <div className="mb-2 text-[12px] font-semibold text-primary">
                OneAgent
              </div>

              {loading ? (
                <div
                  className="flex items-center gap-1.5 text-[13px] text-muted"
                  role="status"
                  aria-live="polite"
                >
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97706]" />

                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97706]"
                    style={{ animationDelay: "100ms" }}
                  />

                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97706]"
                    style={{ animationDelay: "200ms" }}
                  />

                  <span className="ml-1">Processing...</span>
                </div>
              ) : error ? (
                <div
                  className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-4 text-[13.5px] leading-relaxed text-[#B91C1C]"
                  role="alert"
                >
                  {error}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-[13.5px] leading-relaxed text-[#374151] whitespace-pre-wrap">
                  {answer}
                </div>
              )}
            </div>
          </div>

          {/* New task */}
          {!loading && (
            <button
              type="button"
              onClick={startNewTask}
              className="self-start text-[12px] font-medium text-[#D97706] hover:underline"
            >
              + Start a new task
            </button>
          )}
        </div>
      )}

      {/* Recent activity */}
      {!question && (
        <div className="mx-auto w-full max-w-3xl pt-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[12px] font-semibold text-primary">
              Recent activity
            </div>

            <Link
              href="/history"
              className="text-[11.5px] font-medium text-[#D97706] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-[#F0F0EE] rounded-xl border border-border bg-card">
            <ActivityItem
              title="Competitor pricing brief"
              detail="Research · Writing"
              time="12m ago"
            />

            <ActivityItem
              title="Refactor auth middleware"
              detail="Coding"
              time="48m ago"
            />

            <ActivityItem
              title="Product launch deck"
              detail="Research · Writing · Images"
              time="2h ago"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function ActivityItem({
  title,
  detail,
  time,
}: {
  title: string;
  detail: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="min-w-0">
        <div className="truncate text-[12.5px] font-medium text-primary">
          {title}
        </div>

        <div className="mt-0.5 text-[11px] text-faint">{detail}</div>
      </div>

      <div className="ml-4 shrink-0 text-[10.5px] text-faint">
        {time}
      </div>
    </div>
  );
}