"use client";

import {
  LayoutGrid,
  Workflow,
  Bot,
  History,
  Settings,
  Sparkles,
} from "lucide-react";
import { navItems } from "@/lib/mock-data";

const ICONS = {
  layout: LayoutGrid,
  workflow: Workflow,
  bot: Bot,
  history: History,
  settings: Settings,
};

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-56 shrink-0 flex-col border-r border-border bg-card px-4 py-5">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-7 h-7 rounded-md flex items-center justify-center bg-primary text-white text-sm font-bold">
          1
        </div>
        <span className="font-semibold text-[15px] tracking-tight text-primary">
          OneAgent
        </span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <button
              key={item.label}
              className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-colors ${
                item.active
                  ? "bg-accent-tint text-primary"
                  : "text-muted hover:bg-background hover:text-primary"
              }`}
            >
              <Icon
                size={16.5}
                strokeWidth={2}
                color={item.active ? "#D97706" : undefined}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint mb-1.5">
            <Sparkles size={12} color="#D97706" /> Usage this week
          </div>
          <div className="text-[20px] font-semibold text-primary leading-none">
            1,204
          </div>
          <div className="text-[11.5px] text-faint mt-0.5">
            agent calls &middot; 6 workflows
          </div>
        </div>
      </div>
    </aside>
  );
}
