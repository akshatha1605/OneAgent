# OneAgent Frontend

The dashboard/UI layer for OneAgent, built with **Next.js + React + Tailwind CSS**,
matching the stack and palette from the OneAgent project report.

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — you'll see the dashboard with the live
workflow pipeline visualizer, running agents, recent workflows, and connected
agents panel, all wired to mock data so it's fully interactive immediately.

## What's here

```
app/
  layout.tsx          root layout, loads Inter + IBM Plex Mono
  page.tsx             the dashboard page — composes all components below
  globals.css          Tailwind directives + base styles
  api/workflow/route.ts   mock endpoint standing in for the FastAPI backend
components/
  Sidebar.tsx           nav: Dashboard / Workflows / Agents / History / Settings
  TopBar.tsx             search bar + notifications + avatar
  QuickActions.tsx       Research / Coding / Writing / Images / Documents / New Workflow
  PipelineVisualizer.tsx the signature element — animated orchestration stepper
                          (Task Analysis → Agent Selection → Processing →
                          Aggregation → Complete)
  RunningAgents.tsx       live progress bars per active agent
  RecentWorkflows.tsx     workflow history with status + agents used
  ConnectedAgents.tsx     LLM + MCP tool connection status grid
  TodaysTasks.tsx         simple task checklist
lib/
  mock-data.ts            all mock data in one place — swap for real API calls
```

## Design tokens

Colors and fonts are wired into `tailwind.config.ts` under `theme.extend`, so
use the semantic names instead of raw hex in new components:

| Token         | Value      | Use                          |
|---------------|------------|-------------------------------|
| `background`  | `#F7F7F5`  | page background               |
| `card`        | `#FFFFFF`  | card surfaces                 |
| `primary`     | `#111111`  | headings, primary buttons     |
| `accent`      | `#D97706`  | active states, primary CTAs   |
| `accent-tint` | `#FDF3E7`  | active nav item background    |
| `success`     | `#16A34A`  | completed steps, online status|
| `border`      | `#E5E5E5`  | hairline borders               |
| `muted`       | `#6B7280`  | secondary text                 |
| `faint`       | `#9CA3AF`  | tertiary text, timestamps      |

Fonts: **Inter** for UI text, **IBM Plex Mono** for numeric/data values
(percentages, counters) — gives the dashboard a slight "ops console" feel
appropriate for an orchestration platform, loaded via Google Fonts in
`globals.css`.

## Connecting to the real backend

Right now `app/api/workflow/route.ts` is a mock Next.js route handler so the
frontend runs standalone with zero backend setup. When the FastAPI +
LangGraph service is ready:

1. Add `NEXT_PUBLIC_API_URL` to `.env.local` pointing at the FastAPI server.
2. Replace the body of `app/api/workflow/route.ts` with a `fetch()` call to
   `${process.env.NEXT_PUBLIC_API_URL}/workflow`, or call the FastAPI URL
   directly from client components — either works, since the response shape
   is already designed to match what the LangGraph orchestrator returns
   (`workflow_id`, `status`, `selected_agents`, `steps[]`).
3. Swap `lib/mock-data.ts` values for real fetched data (e.g. via React Query,
   per the original tech stack recommendation) once endpoints for
   `/agents`, `/workflows`, and `/tasks` exist.

No component needs to change shape — they all consume plain props/data, so
swapping the data source is a `lib/` and `api/` change only.

## Next steps

- Add auth (Supabase Auth / Clerk per the tech stack) and gate the dashboard
  behind a session check in `app/layout.tsx`.
- Add a `/workflows/[id]` page for the detailed view of a single run.
- Add a chat-style input flow off the top-bar search box that POSTs to
  `/api/workflow` and streams step updates back (SSE or polling).
