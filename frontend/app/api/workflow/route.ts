import { NextResponse } from "next/server";

// This route stands in for the FastAPI backend during frontend development.
// Once the FastAPI + LangGraph service exists, replace the body of this
// handler with a fetch() to e.g. `${process.env.NEXT_PUBLIC_API_URL}/workflow`
// and this page component doesn't need to change at all.

export async function POST(request: Request) {
  const body = await request.json();
  const prompt: string = body?.prompt ?? "";

  if (!prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  // Mocked orchestration response shape — mirrors what the
  // LangGraph orchestrator + response aggregator would return.
  return NextResponse.json({
    workflow_id: `wf_${Date.now()}`,
    status: "in_progress",
    selected_agents: ["research", "writing"],
    steps: [
      { name: "Task Analysis", status: "complete" },
      { name: "Agent Selection", status: "complete" },
      { name: "Processing", status: "in_progress" },
      { name: "Aggregation", status: "pending" },
      { name: "Complete", status: "pending" },
    ],
  });
}
