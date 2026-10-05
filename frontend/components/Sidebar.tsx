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
  {
    label: "Dashboard",
    icon: "layout",
    href: "/",
  },
  {
    label: "Workflows",
    icon: "workflow",
    href: "/workflows",
  },
  {
    label: "Agents",
    icon: "bot",
    href: "/agents",
  },
  {
    label: "History",
    icon: "history",
    href: "/history",
  },
  {
    label: "Settings",
    icon: "settings",
    href: "/settings",
  },
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
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-6 md:flex">
      {/* Brand */}
      <div className="mb-10 flex items-center gap-3 px-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-white shadow-sm"
          aria-hidden="true"
        >
          1
        </div>

        <div>
          <div className="text-[16px] font-semibold tracking-tight text-primary">
            OneAgent
          </div>

          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
            AI Workspace
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
        Workspace
      </div>

      <nav
        className="flex flex-col gap-1"
        aria-label="Main navigation"
      >
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
              className={`group flex min-h-[43px] items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-all ${
                active
                  ? "bg-accent-tint text-primary shadow-sm"
                  : "text-muted hover:bg-background hover:text-primary"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-white text-[#D97706]"
                    : "text-muted group-hover:text-primary"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.2 : 1.9}
                  aria-hidden="true"
                />
              </span>

              <span>{item.label}</span>

              {active && (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D97706]"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usage */}
      <div className="mt-auto pt-8">
        <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          Usage
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-muted">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF7ED]">
              <Sparkles
                size={14}
                className="text-[#D97706]"
                aria-hidden="true"
              />
            </span>

            <span>This week</span>
          </div>

          <div className="mt-4">
            <div className="text-[24px] font-semibold leading-none tracking-tight text-primary">
              {weeklyAgentCalls.toLocaleString()}
            </div>

            <div className="mt-1.5 text-[12px] text-faint">
              agent calls
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-3 text-[12px] text-faint">
            <span className="font-medium text-primary">
              {weeklyWorkflows}
            </span>{" "}
            {weeklyWorkflows === 1
              ? "workflow"
              : "workflows"}
          </div>
        </div>
      </div>
    </aside>
  );
}