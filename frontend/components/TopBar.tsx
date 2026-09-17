"use client";

import { Bell } from "lucide-react";

export default function TopBar() {
  return (
    <div className="flex items-center justify-end border-b border-border bg-card px-6 py-3.5">
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-md hover:bg-background transition-colors">
          <Bell size={17} className="text-muted" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>

        <div className="w-8 h-8 rounded-full bg-primary text-white text-[12px] font-semibold flex items-center justify-center">
          AK
        </div>
      </div>
    </div>
  );
}