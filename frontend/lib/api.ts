const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

type ApiErrorResponse = {
  detail?: string;
  message?: string;
  error?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/* -------------------------------------------------------------------------- */
/* Generic API Request                                                        */
/* -------------------------------------------------------------------------- */

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

      message =
        data.detail ??
        data.message ??
        data.error ??
        message;
    } catch {
      // Keep default error message.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

export type HealthResponse = {
  status: string;
  service: string;
};

export function getHealth() {
  return request<HealthResponse>("/api/health");
}

/* -------------------------------------------------------------------------- */
/* Agents                                                                     */
/* -------------------------------------------------------------------------- */

export type BackendAgent = {
  id: string;
  name: string;
  provider?: string;
  type?: string;
  status?: string;
  description?: string;
  capabilities?: string[];
  callsToday?: number;
};

export type AgentsResponse = {
  agents: BackendAgent[];
};

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

export type WorkflowStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | string;

export type BackendWorkflow = {
  workflow_id: string;
  task: string;
  status: WorkflowStatus;
  created_at?: string;
};

export type WorkflowsResponse = {
  workflows: BackendWorkflow[];
};

export function getWorkflows() {
  return request<WorkflowsResponse>("/api/workflows");
}

export type WorkflowTask = {
  name: string;
  status: WorkflowStatus;
};

export type WorkflowDetailResponse = {
  workflow_id: string;
  status: WorkflowStatus;
  tasks: WorkflowTask[];
};

export function getWorkflow(workflowId: string) {
  return request<WorkflowDetailResponse>(
    `/api/workflows/${encodeURIComponent(workflowId)}`
  );
}

export type CreateWorkflowRequest = {
  task: string;
};

export type CreateWorkflowResponse = {
  workflow_id: string;
  task: string;
  status: WorkflowStatus;
  created_at: string;
};

export function createWorkflow(task: string) {
  return request<CreateWorkflowResponse>("/api/workflows", {
    method: "POST",
    body: JSON.stringify({
      task,
    } satisfies CreateWorkflowRequest),
  });
}

export type ExecuteWorkflowResponse = {
  workflow_id: string;
  status: WorkflowStatus;
  task_id?: string;
  result?: OrchestrationResponse;
  message?: string;
};

export function executeWorkflow(workflowId: string) {
  return request<ExecuteWorkflowResponse>(
    `/api/workflows/${encodeURIComponent(workflowId)}/execute`,
    {
      method: "POST",
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Orchestration                                                              */
/* -------------------------------------------------------------------------- */

export type OrchestrationRequest = {
  task: string;
};

export type OrchestrationAnalysis = {
  [key: string]: unknown;
};

export type OrchestrationRouting = {
  method?: string;
  confidence?: number;
};

export type SelectedAgent = {
  id?: string;
  name?: string;
};

export type OrchestrationModel = {
  selected?: string | null;
  attempted?: string[];
  fallback_used?: boolean;
  fallback_from?: string | null;
};

export type OrchestrationSearch = {
  provider?: string | null;
  used?: boolean;
};

export type OrchestrationResult = {
  status?: string;
  output?: string;
  result?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

export type OrchestrationResponse = {
  status: string;
  task?: string;

  analysis?: OrchestrationAnalysis;

  routing?: OrchestrationRouting;

  selected_agent?: SelectedAgent | null;

  model?: OrchestrationModel;

  search?: OrchestrationSearch;

  result?: OrchestrationResult;

  error?: string;
  message?: string;
};

export function orchestrateTask(task: string) {
  return request<OrchestrationResponse>("/api/orchestrate", {
    method: "POST",
    body: JSON.stringify({
      task,
    } satisfies OrchestrationRequest),
  });
}

/* -------------------------------------------------------------------------- */
/* Orchestration Status                                                       */
/* -------------------------------------------------------------------------- */

export type WorkflowStatusResponse = {
  workflow_id: string;
  status: WorkflowStatus;
  result?: string;
  error?: string;
};

export function getOrchestrationStatus(workflowId: string) {
  return request<WorkflowStatusResponse>(
    `/api/orchestrate/${encodeURIComponent(workflowId)}/status`
  );
}

/* -------------------------------------------------------------------------- */
/* Task Analysis                                                              */
/* -------------------------------------------------------------------------- */

export type AnalyzeTaskRequest = {
  task: string;
};

export type AnalyzeTaskResponse = {
  [key: string]: unknown;
};

export function analyzeTask(task: string) {
  return request<AnalyzeTaskResponse>("/api/analyze", {
    method: "POST",
    body: JSON.stringify({
      task,
    } satisfies AnalyzeTaskRequest),
  });
}

/* -------------------------------------------------------------------------- */
/* Task History                                                               */
/* -------------------------------------------------------------------------- */

export type TaskHistoryItem = {
  id: string;
  task: string;
  status: string;
  created_at: string;
  agent: string | null;
  model: string | null;
  confidence: number | null;
};

export type TasksResponse = {
  tasks: TaskHistoryItem[];
};

export function getTasks() {
  return request<TasksResponse>("/api/tasks");
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

export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  plan?: string;
};

export type RegisterResponse = {
  message: string;
  user: {
    name: string;
    email: string;
  };
};

export type LoginResponse = {
  message: string;
  access_token: string;
  token_type: string;
};

export type CurrentUserResponse = AuthUser;

export function registerUser(data: RegisterRequest) {
  return request<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function loginUser(data: LoginRequest) {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCurrentUser() {
  return request<CurrentUserResponse>("/api/auth/me");
}

/* -------------------------------------------------------------------------- */
/* User Profile                                                               */
/* -------------------------------------------------------------------------- */

export type UserProfile = {
  id?: string;
  name: string;
  email: string;
  plan: string;
};

export type UpdateProfileResponse = {
  message: string;
  profile: {
    name: string;
    email: string;
    plan: string;
  };
};

export function getProfile() {
  return request<UserProfile>("/api/users/profile");
}

export function updateProfile(data: {
  name: string;
  email: string;
  plan?: string;
}) {
  return request<UpdateProfileResponse>("/api/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}