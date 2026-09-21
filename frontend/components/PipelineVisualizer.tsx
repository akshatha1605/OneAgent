"use client";

import { Fragment } from "react";
import {
  CheckCircle2,
  Loader2,
  Circle,
} from "lucide-react";
import { pipelineSteps } from "@/lib/mock-data";

type WorkflowStatus = "queued" | "running" | "completed" | "failed";

type PipelineVisualizerProps = {
  activeStep?: number;
  status?: WorkflowStatus;
  title?: string;
  agentCount?: number;
  elapsedTime?: string;
};

const statusConfig: Record<
  WorkflowStatus,
  {
    label: string;
    className: string;
  }
> = {
  queued: {
    label: "QUEUED",
    className: "bg-[#F0F0EE] text-[#6B6B65]",
  },
  running: {
    label: "IN PROGRESS",
    className: "bg-accent-tint text-[#B45309]",
  },
  completed: {
    label: "COMPLETED",
    className: "bg-success/10 text-[#15803D]",
  },
  failed: {
    label: "FAILED",
    className: "bg-red-50 text-red-700",
  },
};

export default function PipelineVisualizer({
  activeStep = 0,
  status = "running",
  title = 'Analyze churn drivers & draft report',
  agentCount = 3,
  elapsedTime = "40s",
}: PipelineVisualizerProps) {
  const safeActiveStep = Math.max(
    0,
    Math.min(activeStep, pipelineSteps.length - 1)
  );

  const currentStatus = statusConfig[status];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-primary">
            Live workflow &mdash; &ldquo;{title}&rdquo;
          </div>

          <div className="mt-0.5 text-[12px] text-faint">
            Orchestrating {agentCount}{" "}
            {agentCount === 1 ? "agent" : "agents"} &middot; started{" "}
            {elapsedTime} ago
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${currentStatus.className}`}
        >
          {currentStatus.label}
        </span>
      </div>

      {/* Pipeline */}
      <div className="flex items-center">
        {pipelineSteps.map((step, index) => {
          const isCompleted =
            status === "completed" || index < safeActiveStep;

          const isActive =
            status === "running" && index === safeActiveStep;

          const isFailed =
            status === "failed" && index === safeActiveStep;

          return (
            <Fragment key={step}>
              <div className="flex min-w-[84px] flex-col items-center gap-2">
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 ${
                    isCompleted
                      ? "bg-success"
                      : isFailed
                        ? "bg-red-600"
                        : isActive
                          ? "bg-accent"
                          : "border border-border bg-[#F0F0EE]"
                  }`}
                >
                  {isActive && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
                  )}

                  {isCompleted ? (
                    <CheckCircle2
                      size={16}
                      className="relative text-white"
                    />
                  ) : isFailed ? (
                    <span className="relative text-[13px] font-bold text-white">
                      !
                    </span>
                  ) : isActive ? (
                    <Loader2
                      size={14}
                      className="relative animate-spin text-white"
                    />
                  ) : (
                    <Circle
                      size={8}
                      className="text-[#C9C9C4]"
                      fill="currentColor"
                    />
                  )}
                </div>

                <span
                  className={`text-center text-[11.5px] font-medium ${
                    isCompleted || isActive || isFailed
                      ? "text-primary"
                      : "text-[#B0B0AA]"
                  }`}
                >
                  {step}
                </span>
              </div>

              {index !== pipelineSteps.length - 1 && (
                <div className="mb-5 h-[2px] flex-1 overflow-hidden rounded-full bg-[#EDEDE9]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status === "failed" && index >= safeActiveStep
                        ? "bg-red-500"
                        : "bg-success"
                    }`}
                    style={{
                      width:
                        index < safeActiveStep ||
                        status === "completed"
                          ? "100%"
                          : "0%",
                    }}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}