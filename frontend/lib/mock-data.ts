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
