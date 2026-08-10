export type QuickAction = {
  label: string;
  icon: "compass" | "code" | "pen" | "image" | "file" | "plus";
  primary?: boolean;
};

export const quickActions: QuickAction[] = [
  { label: "Research", icon: "compass" },
  { label: "Coding", icon: "code" },
  { label: "Writing", icon: "pen" },
  { label: "Images", icon: "image" },
  { label: "Documents", icon: "file" },
  { label: "New Workflow", icon: "plus", primary: true },
];

export type NavItem = {
  label: string;
  icon: "layout" | "workflow" | "bot" | "history" | "settings";
  active?: boolean;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", icon: "layout", active: true },
  { label: "Workflows", icon: "workflow" },
  { label: "Agents", icon: "bot" },
  { label: "History", icon: "history" },
  { label: "Settings", icon: "settings" },
];

export const pipelineSteps = [
  "Task Analysis",
  "Agent Selection",
  "Processing",
  "Aggregation",
  "Complete",
];

export type RunningAgent = {
  name: string;
  task: string;
  pct: number;
  tone: string;
};

export const runningAgents: RunningAgent[] = [
  { name: "Research Agent", task: "Gathering market data on EV batteries", pct: 72, tone: "#D97706" },
  { name: "Writing Agent", task: "Drafting exec summary from findings", pct: 34, tone: "#2563EB" },
  { name: "Document Agent", task: "Parsing uploaded Q3 report.pdf", pct: 91, tone: "#16A34A" },
];

export type WorkflowItem = {
  title: string;
  agents: string[];
  time: string;
  status: "done" | "failed";
};

export const recentWorkflows: WorkflowItem[] = [
  { title: "Competitor pricing brief", agents: ["Research", "Writing"], time: "12m ago", status: "done" },
  { title: "Refactor auth middleware", agents: ["Coding"], time: "48m ago", status: "done" },
  { title: "Product launch deck", agents: ["Research", "Writing", "Image"], time: "2h ago", status: "done" },
  { title: "Invoice batch OCR + summary", agents: ["Document"], time: "5h ago", status: "failed" },
];

// lib/mock-data.ts  (add below the existing recentWorkflows block)

export type WorkflowStatus = "running" | "done" | "failed" | "queued";

export type FullWorkflow = {
  id: string;
  title: string;
  description: string;
  agents: string[];
  status: WorkflowStatus;
  progress: number; // 0-100
  createdAt: string;
  duration: string;
};

export const allWorkflows: FullWorkflow[] = [
  {
    id: "wf_8841",
    title: "Analyze churn drivers & draft report",
    description: "Pulls usage data, identifies churn signals, and writes an executive summary.",
    agents: ["Research", "Writing"],
    status: "running",
    progress: 62,
    createdAt: "Just now",
    duration: "40s",
  },
  {
    id: "wf_8840",
    title: "Competitor pricing brief",
    description: "Scrapes competitor pricing pages and summarizes positioning.",
    agents: ["Research", "Writing"],
    status: "done",
    progress: 100,
    createdAt: "12m ago",
    duration: "3m 10s",
  },
  {
    id: "wf_8839",
    title: "Refactor auth middleware",
    description: "Reviews auth middleware for edge cases and proposes a refactor.",
    agents: ["Coding"],
    status: "done",
    progress: 100,
    createdAt: "48m ago",
    duration: "1m 52s",
  },
  {
    id: "wf_8838",
    title: "Product launch deck",
    description: "Builds slide content and generates supporting illustrations.",
    agents: ["Research", "Writing", "Image"],
    status: "done",
    progress: 100,
    createdAt: "2h ago",
    duration: "5m 04s",
  },
  {
    id: "wf_8837",
    title: "Invoice batch OCR + summary",
    description: "OCRs uploaded invoices and summarizes totals by vendor.",
    agents: ["Document"],
    status: "failed",
    progress: 47,
    createdAt: "5h ago",
    duration: "—",
  },
  {
    id: "wf_8836",
    title: "Weekly newsletter draft",
    description: "Drafts the weekly newsletter from this week's shipped changes.",
    agents: ["Writing"],
    status: "queued",
    progress: 0,
    createdAt: "Scheduled",
    duration: "—",
  },
];

// --- Agents ---

export type AgentType = "llm" | "tool";
export type AgentStatus = "online" | "idle" | "offline";

export type AgentDetail = {
  id: string;
  name: string;
  provider: string;
  type: AgentType;
  status: AgentStatus;
  description: string;
  capabilities: string[];
  callsToday: number;
};

export const agentsCatalog: AgentDetail[] = [
  {
    id: "claude",
    name: "Claude",
    provider: "Anthropic",
    type: "llm",
    status: "online",
    description: "Long-context reasoning, writing, and document analysis.",
    capabilities: ["Reasoning", "Writing", "Document analysis", "Code review"],
    callsToday: 412,
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    type: "llm",
    status: "online",
    description: "General-purpose reasoning and coding assistant.",
    capabilities: ["Reasoning", "Coding", "General Q&A"],
    callsToday: 358,
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google",
    type: "llm",
    status: "online",
    description: "Multimodal reasoning across text, image, and data.",
    capabilities: ["Multimodal", "Reasoning", "Image understanding"],
    callsToday: 201,
  },
  {
    id: "tavily",
    name: "Tavily",
    provider: "Tavily",
    type: "tool",
    status: "online",
    description: "Real-time web search for up-to-date information.",
    capabilities: ["Web search", "News retrieval"],
    callsToday: 156,
  },
  {
    id: "mcp-github",
    name: "MCP: GitHub",
    provider: "Model Context Protocol",
    type: "tool",
    status: "idle",
    description: "Reads and writes to connected GitHub repositories.",
    capabilities: ["Read repos", "Open PRs", "Read issues"],
    callsToday: 24,
  },
  {
    id: "mcp-postgres",
    name: "MCP: Postgres",
    provider: "Model Context Protocol",
    type: "tool",
    status: "idle",
    description: "Runs read queries against the connected database.",
    capabilities: ["SQL queries", "Schema inspection"],
    callsToday: 9,
  },
  {
    id: "docker-sandbox",
    name: "Docker Sandbox",
    provider: "Internal",
    type: "tool",
    status: "offline",
    description: "Executes generated code safely in an isolated container.",
    capabilities: ["Code execution", "Package install"],
    callsToday: 0,
  },
];

// --- History ---

export type HistoryEntry = {
  id: string;
  title: string;
  agents: string[];
  outcome: "success" | "failed";
  time: string;
  group: "Today" | "Yesterday" | "Earlier";
};

export const historyLog: HistoryEntry[] = [
  { id: "h1", title: "Analyze churn drivers & draft report", agents: ["Research", "Writing"], outcome: "success", time: "10:42 AM", group: "Today" },
  { id: "h2", title: "Competitor pricing brief", agents: ["Research", "Writing"], outcome: "success", time: "9:58 AM", group: "Today" },
  { id: "h3", title: "Refactor auth middleware", agents: ["Coding"], outcome: "success", time: "9:10 AM", group: "Today" },
  { id: "h4", title: "Invoice batch OCR + summary", agents: ["Document"], outcome: "failed", time: "6:15 PM", group: "Yesterday" },
  { id: "h5", title: "Product launch deck", agents: ["Research", "Writing", "Image"], outcome: "success", time: "2:40 PM", group: "Yesterday" },
  { id: "h6", title: "Weekly newsletter draft", agents: ["Writing"], outcome: "success", time: "11:05 AM", group: "Yesterday" },
  { id: "h7", title: "Customer feedback theme analysis", agents: ["Research"], outcome: "success", time: "Mon", group: "Earlier" },
  { id: "h8", title: "Landing page copy variants", agents: ["Writing"], outcome: "success", time: "Mon", group: "Earlier" },
  { id: "h9", title: "Bug triage summary", agents: ["Coding", "Writing"], outcome: "failed", time: "Fri", group: "Earlier" },
];

export type ConnectedAgent = {
  name: string;
  role: string;
  status: "online" | "idle";
};

export const connectedAgents: ConnectedAgent[] = [
  { name: "Claude", role: "Reasoning + long-context", status: "online" },
  { name: "GPT-4", role: "General reasoning", status: "online" },
  { name: "Gemini", role: "Multimodal tasks", status: "online" },
  { name: "Tavily", role: "Web search", status: "online" },
  { name: "MCP: GitHub", role: "Code + repo tools", status: "idle" },
  { name: "MCP: Postgres", role: "Data queries", status: "idle" },
];

export const todaysTasks = [
  "Review churn analysis draft",
  "Approve image set for launch deck",
  "Merge auth-middleware PR",
];
