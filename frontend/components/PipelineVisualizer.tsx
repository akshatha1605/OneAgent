"use client";

import { useEffect, useState, Fragment } from "react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { pipelineSteps } from "@/lib/mock-data";

export default function PipelineVisualizer() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % (pipelineSteps.length + 1));
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[13px] font-semibold text-primary">
            Live workflow &mdash; &ldquo;Analyze churn drivers &amp; draft report&rdquo;
          </div>
          <div className="text-[12px] text-faint mt-0.5">
            Orchestrating 3 agents &middot; started 40s ago
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-accent-tint text-[#B45309]">
          IN PROGRESS
        </span>
      </div>

      <div className="flex items-center">
        {pipelineSteps.map((step, i) => {
          const done = i < active;
          const isActive = i === active;
          return (
            <Fragment key={step}>
              <div className="flex flex-col items-center gap-2 min-w-[84px]">
                <div
                  className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500 ${
                    done
                      ? "bg-success"
                      : isActive
                      ? "bg-accent"
                      : "bg-[#F0F0EE] border border-border"
                  }`}
                >
                  {isActive && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-40 animate-ping" />
                  )}
                  {done ? (
                    <CheckCircle2 size={16} color="#fff" />
                  ) : isActive ? (
                    <Loader2 size={14} color="#fff" className="animate-spin" />
                  ) : (
                    <Circle size={8} color="#C9C9C4" fill="#C9C9C4" />
                  )}
                </div>
                <span
                  className={`text-[11.5px] text-center font-medium ${
                    done || isActive ? "text-primary" : "text-[#B0B0AA]"
                  }`}
                >
                  {step}
                </span>
              </div>
              {i !== pipelineSteps.length - 1 && (
                <div className="flex-1 h-[2px] mb-5 rounded-full overflow-hidden bg-[#EDEDE9]">
                  <div
                    className="h-full bg-success transition-all duration-700"
                    style={{ width: i < active ? "100%" : "0%" }}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
