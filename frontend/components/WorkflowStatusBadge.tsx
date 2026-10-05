"use client";

export type WorkflowStatus =
  | "running"
  | "done"
  | "failed"
  | "queued";

const STYLES: Record<
  WorkflowStatus,
  {
    bg: string;
    text: string;
    label: string;
    dot: string;
  }
> = {
  running: {
    bg: "bg-[#FFF7ED]",
    text: "text-[#B45309]",
    label: "IN PROGRESS",
    dot: "bg-[#D97706]",
  },
  done: {
    bg: "bg-[#EAF7EE]",
    text: "text-[#15803D]",
    label: "COMPLETE",
    dot: "bg-[#16A34A]",
  },
  failed: {
    bg: "bg-[#FDECEC]",
    text: "text-[#DC2626]",
    label: "FAILED",
    dot: "bg-[#DC2626]",
  },
  queued: {
    bg: "bg-[#F3F4F6]",
    text: "text-[#6B7280]",
    label: "QUEUED",
    dot: "bg-[#9CA3AF]",
  },
};

type WorkflowStatusBadgeProps = {
  status: WorkflowStatus;
};

export default function WorkflowStatusBadge({
  status,
}: WorkflowStatusBadgeProps) {
  const style = STYLES[status];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${style.bg} ${style.text}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
        aria-hidden="true"
      />

      {style.label}
    </span>
  );
}