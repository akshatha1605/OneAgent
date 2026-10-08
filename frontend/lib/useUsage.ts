"use client";

import { useEffect, useState } from "react";
import { getTasks, getWorkflows } from "@/lib/api";

export function useUsage() {
  const [weeklyAgentCalls, setWeeklyAgentCalls] = useState(0);
  const [weeklyWorkflows, setWeeklyWorkflows] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      try {
        const [tasksResponse, workflowsResponse] =
          await Promise.all([
            getTasks(),
            getWorkflows(),
          ]);

        if (cancelled) {
          return;
        }

        const now = new Date();

        // Monday 00:00 of the current week
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();

        const daysFromMonday =
          day === 0 ? 6 : day - 1;

        startOfWeek.setDate(
          startOfWeek.getDate() - daysFromMonday
        );

        startOfWeek.setHours(0, 0, 0, 0);

        const agentCalls = tasksResponse.tasks.filter(
          (task) => {
            const createdAt = new Date(
              task.created_at
            );

            return (
              !Number.isNaN(createdAt.getTime()) &&
              createdAt >= startOfWeek
            );
          }
        ).length;

        const workflows = workflowsResponse.workflows.filter(
          (workflow) => {
            if (!workflow.created_at) {
              return false;
            }

            const createdAt = new Date(
              workflow.created_at
            );

            return (
              !Number.isNaN(createdAt.getTime()) &&
              createdAt >= startOfWeek
            );
          }
        ).length;

        setWeeklyAgentCalls(agentCalls);
        setWeeklyWorkflows(workflows);
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