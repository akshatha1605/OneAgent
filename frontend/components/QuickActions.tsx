"use client";

import { Compass, Code2, PenLine, Image as ImageIcon, FileText, Plus } from "lucide-react";
import { quickActions } from "@/lib/mock-data";

const ICONS = {
  compass: Compass,
  code: Code2,
  pen: PenLine,
  image: ImageIcon,
  file: FileText,
  plus: Plus,
};

export default function QuickActions() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
      {quickActions.map((a) => {
        const Icon = ICONS[a.icon];
        return (
          <button
            key={a.label}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border py-4 text-[12.5px] font-medium transition-all ${
              a.primary
                ? "bg-primary text-white border-transparent shadow-sm hover:brightness-105"
                : "border-border bg-card text-[#374151] hover:border-accent/40 hover:bg-[#FFFBF5]"
            }`}
          >
            <Icon size={17} strokeWidth={2} color={a.primary ? "#fff" : "#D97706"} />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
