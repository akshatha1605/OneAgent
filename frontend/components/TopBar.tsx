"use client";

import { Bell, ChevronDown } from "lucide-react";

type TopBarProps = {
  userInitials?: string;
  hasNotifications?: boolean;
};

export default function TopBar({
  userInitials = "U",
  hasNotifications = false,
}: TopBarProps) {
  return (
    <header className="flex h-[68px] shrink-0 items-center justify-end border-b border-border bg-card px-6">
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          type="button"
          aria-label={
            hasNotifications
              ? "View notifications"
              : "No new notifications"
          }
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-background hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <Bell
            size={19}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          {hasNotifications && (
            <span
              className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-card"
              aria-hidden="true"
            />
          )}
        </button>

        {/* Divider */}
        <div
          className="mx-1 h-7 w-px bg-border"
          aria-hidden="true"
        />

        {/* User menu */}
        <button
          type="button"
          aria-label="Open user menu"
          className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[12px] font-semibold tracking-wide text-white">
            {userInitials.slice(0, 2).toUpperCase()}
          </span>

          <div className="hidden text-left sm:block">
            <p className="text-[13px] font-semibold leading-4 text-primary">
              User
            </p>

            <p className="text-[11px] leading-4 text-faint">
              OneAgent
            </p>
          </div>

          <ChevronDown
            size={15}
            className="hidden text-faint transition-transform group-hover:text-primary sm:block"
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}