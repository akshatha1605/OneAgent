"use client";

import { WorkflowStatus } from "@/lib/mock-data";

const STYLES: Record<WorkflowStatus, { bg: string; text: string; label: string }> = {
  running: { bg: "bg-accent-tint", text: "text-[#B45309]", label: "IN PROGRESS" },
  done: { bg: "bg-[#EAF7EE]", text: "text-success", label: "COMPLETE" },
  failed: { bg: "bg-[#FDECEC]", text: "text-[#DC2626]", label: "FAILED" },
  queued: { bg: "bg-[#F0F0EE]", text: "text-faint", label: "QUEUED" },
};

export default function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  const s = STYLES[status];
  return (
    <span className={`text-[10.5px] font-semibold px-2 py-1 rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
