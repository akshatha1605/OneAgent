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
  }
> = {
  running: {
    bg: "bg-accent-tint",
    text: "text-[#B45309]",
    label: "IN PROGRESS",
  },
  done: {
    bg: "bg-[#EAF7EE]",
    text: "text-success",
    label: "COMPLETE",
  },
  failed: {
    bg: "bg-[#FDECEC]",
    text: "text-[#DC2626]",
    label: "FAILED",
  },
  queued: {
    bg: "bg-[#F0F0EE]",
    text: "text-faint",
    label: "QUEUED",
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
      className={`shrink-0 rounded-full px-2 py-1 text-[10.5px] font-semibold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}