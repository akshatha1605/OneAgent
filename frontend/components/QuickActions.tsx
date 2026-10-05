"use client";

import {
  Compass,
  Code2,
  PenLine,
  Image as ImageIcon,
  FileText,
  Plus,
} from "lucide-react";

import {
  quickActions,
  type QuickAction,
} from "@/lib/mock-data";

const ICONS = {
  compass: Compass,
  code: Code2,
  pen: PenLine,
  image: ImageIcon,
  file: FileText,
  plus: Plus,
};

type QuickActionsProps = {
  onAction?: (action: QuickAction) => void;
};

export default function QuickActions({
  onAction,
}: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {quickActions.map((action) => {
        const Icon = ICONS[action.icon];

        return (
          <button
            key={action.label}
            type="button"
            onClick={() => onAction?.(action)}
            aria-label={action.label}
            className={`group flex min-h-[100px] flex-col items-center justify-center gap-3 rounded-2xl border px-3 py-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 ${
              action.primary
                ? "border-primary bg-primary text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                : "border-border bg-card text-primary hover:-translate-y-0.5 hover:border-accent/40 hover:bg-[#FFFBF5] hover:shadow-sm"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
                action.primary
                  ? "bg-white/10"
                  : "bg-[#FFF7ED]"
              }`}
            >
              <Icon
                size={19}
                strokeWidth={2}
                className={
                  action.primary
                    ? "text-white"
                    : "text-[#D97706]"
                }
              />
            </div>

            <span className="text-[13px] font-semibold">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}