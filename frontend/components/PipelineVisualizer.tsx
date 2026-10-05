"use client";

import { Fragment } from "react";
import {
  CheckCircle2,
  Loader2,
  Circle,
  Activity,
} from "lucide-react";

import { pipelineSteps } from "@/lib/mock-data";

type WorkflowStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

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
    className: "bg-[#F3F4F6] text-[#6B7280]",
  },
  running: {
    label: "IN PROGRESS",
    className: "bg-[#FFF7ED] text-[#B45309]",
  },
  completed: {
    label: "COMPLETED",
    className: "bg-[#EAF7EE] text-[#15803D]",
  },
  failed: {
    label: "FAILED",
    className: "bg-[#FDECEC] text-[#DC2626]",
  },
};

export default function PipelineVisualizer({
  activeStep = 0,
  status = "running",
  title = "Analyze churn drivers & draft report",
  agentCount = 3,
  elapsedTime = "40s",
}: PipelineVisualizerProps) {
  const safeActiveStep = Math.max(
    0,
    Math.min(
      activeStep,
      Math.max(0, pipelineSteps.length - 1)
    )
  );

  const currentStatus = statusConfig[status];

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF7ED]">
            <Activity
              size={17}
              className="text-[#D97706]"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <div className="truncate text-[16px] font-semibold text-primary">
              Live workflow
            </div>

            <div className="mt-1 truncate text-[13px] text-muted">
              &ldquo;{title}&rdquo;
            </div>

            <div className="mt-1.5 text-[12px] text-faint">
              Orchestrating {agentCount}{" "}
              {agentCount === 1 ? "agent" : "agents"}{" "}
              &middot; started {elapsedTime} ago
            </div>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide ${currentStatus.className}`}
        >
          {currentStatus.label}
        </span>
      </div>

      {/* Pipeline */}
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[620px] items-start px-2">
          {pipelineSteps.map((step, index) => {
            const isCompleted =
              status === "completed" ||
              index < safeActiveStep;

            const isActive =
              status === "running" &&
              index === safeActiveStep;

            const isFailed =
              status === "failed" &&
              index === safeActiveStep;

            const connectorCompleted =
              index < safeActiveStep ||
              status === "completed";

            return (
              <Fragment key={step}>
                {/* Step */}
                <div className="flex w-[110px] shrink-0 flex-col items-center gap-2.5">
                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                      isCompleted
                        ? "bg-[#16A34A] shadow-sm"
                        : isFailed
                          ? "bg-[#DC2626] shadow-sm"
                          : isActive
                            ? "bg-[#D97706] shadow-sm"
                            : "border border-[#D8D8D3] bg-[#F3F4F6]"
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D97706] opacity-25"
                        aria-hidden="true"
                      />
                    )}

                    {isCompleted ? (
                      <CheckCircle2
                        size={18}
                        className="relative text-white"
                        aria-hidden="true"
                      />
                    ) : isFailed ? (
                      <span className="relative text-[14px] font-bold text-white">
                        !
                      </span>
                    ) : isActive ? (
                      <Loader2
                        size={17}
                        className="relative animate-spin text-white"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        size={9}
                        className="text-[#BDBDB7]"
                        fill="currentColor"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <span
                    className={`max-w-[105px] text-center text-[12px] font-medium leading-4 ${
                      isCompleted ||
                      isActive ||
                      isFailed
                        ? "text-primary"
                        : "text-[#A6A6A0]"
                    }`}
                  >
                    {step}
                  </span>
                </div>

                {/* Connector */}
                {index !== pipelineSteps.length - 1 && (
                  <div className="mt-5 h-1 flex-1 overflow-hidden rounded-full bg-[#EDEDE9]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === "failed" &&
                        index >= safeActiveStep
                          ? "bg-[#EF4444]"
                          : "bg-[#16A34A]"
                      }`}
                      style={{
                        width: connectorCompleted
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

      {/* Current step indicator */}
      {status === "running" &&
        pipelineSteps[safeActiveStep] && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#F0F0EE] bg-background px-4 py-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#D97706]" />

            <span className="text-[12px] text-muted">
              Currently processing:
            </span>

            <span className="text-[12px] font-semibold text-primary">
              {pipelineSteps[safeActiveStep]}
            </span>
          </div>
        )}

      {status === "completed" && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] px-4 py-3">
          <CheckCircle2
            size={16}
            className="text-[#16A34A]"
            aria-hidden="true"
          />

          <span className="text-[12px] font-medium text-[#15803D]">
            Workflow completed successfully.
          </span>
        </div>
      )}

      {status === "failed" && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white">
            !
          </span>

          <span className="text-[12px] font-medium text-[#B91C1C]">
            Workflow execution failed at the current step.
          </span>
        </div>
      )}
    </div>
  );
}