"use client";

import { connectedAgents } from "@/lib/mock-data";

export default function ConnectedAgents() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-[13px] font-semibold text-primary mb-4">Connected Agents</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {connectedAgents.map((a) => (
          <div
            key={a.name}
            className="flex items-center gap-2.5 rounded-lg border border-[#F0F0EE] bg-background px-3 py-2.5"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                a.status === "online" ? "bg-success" : "bg-[#D1D5DB]"
              }`}
            />
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-primary truncate">{a.name}</div>
              <div className="text-[10.5px] text-faint truncate">{a.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
