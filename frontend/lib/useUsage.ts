"use client";

import { useEffect, useState } from "react";
import { getUsageSummary } from "@/lib/api";

export function useUsage() {
  const [weeklyAgentCalls, setWeeklyAgentCalls] = useState(0);
  const [weeklyWorkflows, setWeeklyWorkflows] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      try {
        const usage = await getUsageSummary();

        if (cancelled) {
          return;
        }

        setWeeklyAgentCalls(usage.weekly_agent_calls);
        setWeeklyWorkflows(usage.weekly_workflows);
      } catch (error) {
        console.error(
          "Failed to load usage:",
          error
        );
      }
    }

    void loadUsage();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    weeklyAgentCalls,
    weeklyWorkflows,
  };
}