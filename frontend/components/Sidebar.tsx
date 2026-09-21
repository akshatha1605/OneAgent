"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Workflow,
  Bot,
  History,
  Settings,
  Sparkles,
} from "lucide-react";

const ICONS = {
  layout: LayoutGrid,
  workflow: Workflow,
  bot: Bot,
  history: History,
  settings: Settings,
};

const navItems = [
  { label: "Dashboard", icon: "layout", href: "/" },
  { label: "Workflows", icon: "workflow", href: "/workflows" },
  { label: "Agents", icon: "bot", href: "/agents" },
  { label: "History", icon: "history", href: "/history" },
  { label: "Settings", icon: "settings", href: "/settings" },
] as const;

type SidebarProps = {
  weeklyAgentCalls?: number;
  weeklyWorkflows?: number;
};

export default function Sidebar({
  weeklyAgentCalls = 0,
  weeklyWorkflows = 0,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card px-4 py-5 md:flex">
      {/* Brand */}
      <div className="mb-8 flex items-center gap-2 px-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-white"
          aria-hidden="true"
        >
          1
        </div>

        <span className="text-[15px] font-semibold tracking-tight text-primary">
          OneAgent
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon];

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] font-medium transition-colors ${
                active
                  ? "bg-accent-tint text-primary"
                  : "text-muted hover:bg-background hover:text-primary"
              }`}
            >
              <Icon
                size={16.5}
                strokeWidth={2}
                className={active ? "text-[#D97706]" : undefined}
                aria-hidden="true"
              />

              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Usage */}
      <div className="mt-auto pt-6">
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
            <Sparkles
              size={12}
              className="text-[#D97706]"
              aria-hidden="true"
            />
            Usage this week
          </div>

          <div className="text-[20px] font-semibold leading-none text-primary">
            {weeklyAgentCalls.toLocaleString()}
          </div>

          <div className="mt-0.5 text-[11.5px] text-faint">
            agent calls &middot; {weeklyWorkflows}{" "}
            {weeklyWorkflows === 1 ? "workflow" : "workflows"}
          </div>
        </div>
      </div>
    </aside>
  );
}