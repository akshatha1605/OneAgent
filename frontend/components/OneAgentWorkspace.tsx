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
import { useState } from "react";

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

  const submitTask = () => {
    const task = input.trim();

    if (!task || loading) return;

    setQuestion(task);
    setInput("");
    setLoading(true);
    setAnswer("");

    // Temporary frontend simulation.
    // This will be replaced by the FastAPI orchestrator later.
    setTimeout(() => {
      setAnswer(
        "I understand your request. OneAgent will analyze the task, determine the capabilities required, select the most suitable agents internally, and generate the final result here."
      );
      setLoading(false);
    }, 900);
  };

  const selectCapability = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <section className="flex flex-col gap-8">
      {/* Hero */}
      <div className="text-center pt-8">

        <h1 className="text-[28px] font-semibold tracking-tight text-primary">
          What can I help you accomplish?
        </h1>

        <p className="text-[14px] text-muted mt-2">
          Tell OneAgent what you need. It will figure out the best way to
          handle it.
        </p>
      </div>

      {/* Main input */}
      <div className="w-full max-w-3xl mx-auto">
        <div className="rounded-2xl border border-border bg-card shadow-sm p-2 focus-within:border-[#D97706] transition-colors">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitTask();
                }
              }}
              rows={2}
              placeholder="Ask OneAgent to research, write, code, analyze..."
              className="flex-1 resize-none border-0 outline-none bg-transparent px-3 py-3 text-[14px] text-primary placeholder:text-faint"
            />

            <button
              onClick={submitTask}
              disabled={!input.trim() || loading}
              className="w-10 h-10 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center transition-all disabled:opacity-30 hover:brightness-110"
              aria-label="Send"
            >
              <ArrowUp size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-faint mt-2">
          Press Enter to send · Shift + Enter for a new line
        </div>
      </div>

      {/* Capabilities */}
      {!question && (
        <div className="w-full max-w-3xl mx-auto">
          <div className="text-[12px] font-semibold text-primary mb-3">
            Try OneAgent for
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {capabilities.map((capability) => {
              const Icon = capability.icon;

              return (
                <button
                  key={capability.label}
                  onClick={() => selectCapability(capability.prompt)}
                  className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-[12px] font-medium text-[#374151] transition-all hover:border-[#D97706]/40 hover:bg-[#FFFBF5]"
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
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-5">
          {/* User */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary text-white px-4 py-3 text-[13.5px] leading-relaxed">
              {question}
            </div>
          </div>

          {/* OneAgent */}
          <div className="flex gap-3">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-primary text-white flex items-center justify-center">
              <Sparkles size={15} />
            </div>

            <div className="flex-1 pt-1">
              <div className="text-[12px] font-semibold text-primary mb-2">
                OneAgent
              </div>

              {loading ? (
                <div className="flex items-center gap-1.5 text-[13px] text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-bounce"
                    style={{ animationDelay: "100ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-bounce"
                    style={{ animationDelay: "200ms" }}
                  />
                  <span className="ml-1">Thinking...</span>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-[13.5px] text-[#374151] leading-relaxed">
                  {answer}
                </div>
              )}
            </div>
          </div>

          {/* New task */}
          {!loading && (
            <button
              onClick={() => {
                setQuestion("");
                setAnswer("");
              }}
              className="self-start text-[12px] font-medium text-[#D97706] hover:underline"
            >
              + Start a new task
            </button>
          )}
        </div>
      )}

      {/* Recent activity */}
      {!question && (
        <div className="w-full max-w-3xl mx-auto pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12px] font-semibold text-primary">
              Recent activity
            </div>

            <a
              href="/history"
              className="text-[11.5px] font-medium text-[#D97706] hover:underline"
            >
              View all
            </a>
          </div>

          <div className="rounded-xl border border-border bg-card divide-y divide-[#F0F0EE]">
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
        <div className="text-[12.5px] font-medium text-primary truncate">
          {title}
        </div>
        <div className="text-[11px] text-faint mt-0.5">{detail}</div>
      </div>

      <div className="text-[10.5px] text-faint shrink-0 ml-4">
        {time}
      </div>
    </div>
  );
}