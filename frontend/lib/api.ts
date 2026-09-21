const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ApiErrorResponse = {
  detail?: string;
  message?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = (await response.json()) as ApiErrorResponse;
      message = data.detail ?? data.message ?? message;
    } catch {
      // Keep the default error message when the response is not JSON.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type HealthResponse = {
  status?: string;
  message?: string;
};

export type BackendAgent = {
  id: string;
  name: string;
  provider?: string;
  type?: "llm" | "tool" | string;
  status?: "online" | "idle" | "offline" | string;
  description?: string;
  capabilities?: string[];
  callsToday?: number;
};

export type WorkflowStatus =
  | "running"
  | "done"
  | "failed"
  | "queued";

export type AgentsResponse = {
  agents: BackendAgent[];
};

export type BackendWorkflow = {
  id?: string;
  workflow_id?: string;
  title?: string;
  task?: string;
  description?: string;
  status?: string;
  agents?: string[];
  createdAt?: string;
  duration?: string;
  progress?: number;
};

export type WorkflowTask = {
  name: string;
  status: "queued" | "running" | "completed" | "failed" | string;
};

export type WorkflowDetailResponse = {
  workflow_id: string;
  status: "queued" | "running" | "completed" | "failed" | string;
  tasks: WorkflowTask[];
};

export type OrchestrationRequest = {
  task: string;
};

export type OrchestrationResponse = {
  workflow_id?: string;
  workflowId?: string;
  agent?: string;
  status?: string;
  result?: string;
  message?: string;
};

export type WorkflowStatusResponse = {
  workflow_id?: string;
  workflowId?: string;
  status?: string;
  active_step?: number;
  activeStep?: number;
  progress?: number;
  agents?: BackendAgent[];
  result?: string;
  error?: string;
};

/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

export function getHealth() {
  return request<HealthResponse>("/api/health");
}

/* -------------------------------------------------------------------------- */
/* Agents                                                                     */
/* -------------------------------------------------------------------------- */

export function getAgents() {
  return request<AgentsResponse>("/api/agents");
}

export function getAgent(agentId: string) {
  return request<BackendAgent>(
    `/api/agents/${encodeURIComponent(agentId)}`
  );
}

/* -------------------------------------------------------------------------- */
/* Workflows                                                                  */
/* -------------------------------------------------------------------------- */

export type WorkflowsResponse = {
  workflows: BackendWorkflow[];
};

export function getWorkflows() {
  return request<WorkflowsResponse>("/api/workflows");
}

export function getWorkflow(workflowId: string) {
  return request<WorkflowDetailResponse >(
    `/api/workflows/${encodeURIComponent(workflowId)}`
  );
}

export function executeWorkflow(workflowId: string) {
  return request<unknown>(
    `/api/workflows/${encodeURIComponent(workflowId)}/execute`,
    {
      method: "POST",
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Orchestration                                                              */
/* -------------------------------------------------------------------------- */

export function orchestrateTask(task: string) {
  return request<OrchestrationResponse>("/api/orchestrate", {
    method: "POST",
    body: JSON.stringify({
      task,
    } satisfies OrchestrationRequest),
  });
}

export function getOrchestrationStatus(workflowId: string) {
  return request<WorkflowStatusResponse>(
    `/api/orchestrate/${encodeURIComponent(workflowId)}/status`
  );
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token?: string;
  access_token?: string;
  user?: unknown;
  message?: string;
};

export function registerUser(data: RegisterRequest) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function loginUser(data: LoginRequest) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCurrentUser() {
  return request<unknown>("/api/auth/me");
}