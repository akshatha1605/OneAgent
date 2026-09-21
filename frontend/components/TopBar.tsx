"use client";

import { Bell } from "lucide-react";

type TopBarProps = {
  userInitials?: string;
  hasNotifications?: boolean;
};

export default function TopBar({
  userInitials = "U",
  hasNotifications = false,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-end border-b border-border bg-card px-6 py-3.5">
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          type="button"
          aria-label={
            hasNotifications
              ? "View notifications"
              : "No new notifications"
          }
          className="relative rounded-md p-2 transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <Bell
            size={17}
            className="text-muted"
            aria-hidden="true"
          />

          {hasNotifications && (
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent"
              aria-hidden="true"
            />
          )}
        </button>

        {/* User */}
        <button
          type="button"
          aria-label="Open user menu"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {userInitials.slice(0, 2).toUpperCase()}
        </button>
      </div>
    </header>
  );
}