"use client";

import { Search, Bell } from "lucide-react";

export default function TopBar() {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3.5">
      <div className="relative w-full max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          placeholder="Ask OneAgent to do something..."
          className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-[13px] text-primary placeholder:text-faint outline-none focus:border-accent focus:bg-white transition-colors"
        />
      </div>
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
