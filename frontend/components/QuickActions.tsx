"use client";

import {
  Compass,
  Code2,
  PenLine,
  Image as ImageIcon,
  FileText,
  Plus,
} from "lucide-react";
import { quickActions, type QuickAction } from "@/lib/mock-data";

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
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
      {quickActions.map((action) => {
        const Icon = ICONS[action.icon];

        return (
          <button
            key={action.label}
            type="button"
            onClick={() => onAction?.(action)}
            aria-label={action.label}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border py-4 text-[12.5px] font-medium transition-all ${
              action.primary
                ? "border-transparent bg-primary text-white shadow-sm hover:brightness-105"
                : "border-border bg-card text-[#374151] hover:border-accent/40 hover:bg-[#FFFBF5]"
            }`}
          >
            <Icon
              size={17}
              strokeWidth={2}
              className={action.primary ? "text-white" : "text-[#D97706]"}
            />

            {action.label}
          </button>
        );
      })}
    </div>
  );
}