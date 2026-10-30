
import { createClient } from "@/lib/supabase/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

type ApiErrorResponse = {
  detail?: string;
  message?: string;
  error?: string;
  request_id?: string;
};

export class ApiError extends Error {
  status: number;
  requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

/* -------------------------------------------------------------------------- */
/* Generic API Request                                                        */
/* -------------------------------------------------------------------------- */

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient();

  // Read the current Supabase session before making the API request.
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new ApiError(
      `Unable to retrieve authentication session: ${sessionError.message}`,
      401
    );
  }

  // Preserve caller-supplied headers.
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  // Attach the Supabase access token whenever a session exists.
  if (session?.access_token) {
    headers.set(
      "Authorization",
      `Bearer ${session.access_token}`
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let requestId: string | undefined;

    try {
      const data = (await response.json()) as ApiErrorResponse;

      message =
        data.detail ??
        data.message ??
        data.error ??
        message;
      requestId = data.request_id;
    } catch {
      // Keep the default error message.
    }

    throw new ApiError(message, response.status, requestId);
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
  step_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type WorkflowsResponse = {
  workflows: BackendWorkflow[];
};

export function getWorkflows() {
  return request<WorkflowsResponse>("/api/workflows");
}

export type WorkflowTask = {
  id?: number;
  name: string;
  status: WorkflowStatus;
  step_order?: number;
  agent_id?: string | null;
  task_id?: string | null;
  selected_agent?: string | null;
  model?: string | null;
  result?: Record<string, unknown> | string | null;
  error?: string | null;
};

export type WorkflowDetailResponse = {
  workflow_id: string;
  task?: string;
  status: WorkflowStatus;
  created_at?: string;
  updated_at?: string;
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
  updated_at: string;
};

export function createWorkflow(task: string) {
  return request<CreateWorkflowResponse>("/api/workflows", {
    method: "POST",
    body: JSON.stringify({
      task,
    } satisfies CreateWorkflowRequest),
  });
}

export type AddWorkflowStepResponse = WorkflowTask;

export function addWorkflowStep(
  workflowId: string,
  name: string,
  stepOrder?: number,
  agentId?: string
) {
  return request<AddWorkflowStepResponse>(
    `/api/workflows/${encodeURIComponent(workflowId)}/steps`,
    {
      method: "POST",
      body: JSON.stringify({
        name,
        ...(stepOrder === undefined
          ? {}
          : { step_order: stepOrder }),
        ...(agentId === undefined
          ? {}
          : { agent_id: agentId }),
      }),
    }
  );
}

export type UpdateWorkflowStepRequest = {
  name: string;
  step_order: number;
  agent_id: string;
};

export function updateWorkflowStep(
  workflowId: string,
  stepId: number,
  data: UpdateWorkflowStepRequest
) {
  return request<WorkflowTask>(
    `/api/workflows/${encodeURIComponent(workflowId)}/steps/${stepId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export function deleteWorkflowStep(
  workflowId: string,
  stepId: number
) {
  return request<{
    workflow_id: string;
    deleted_step_id: number;
    steps: WorkflowTask[];
  }>(
    `/api/workflows/${encodeURIComponent(workflowId)}/steps/${stepId}`,
    {
      method: "DELETE",
    }
  );
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
/* Conversations                                                              */
/* -------------------------------------------------------------------------- */

export type Conversation = {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ConversationsResponse = {
  conversations: Conversation[];
};

export type CreateConversationResponse = {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export function createConversation(title = "New Chat") {
  return request<CreateConversationResponse>("/api/conversations", {
    method: "POST",
    body: JSON.stringify({
      title,
    }),
  });
}

export function getConversations() {
  return request<ConversationsResponse>("/api/conversations");
}

/* -------------------------------------------------------------------------- */
/* Conversation Messages                                                      */
/* -------------------------------------------------------------------------- */

export type ChatMessageRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  model?: string | null;
  agent_id?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  task_id?: string | null;
  metadata?: OrchestrationResponse | null;
  created_at: string;
};

export type ConversationDetailResponse = {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
};

export function getConversation(conversationId: string) {
  return request<ConversationDetailResponse>(
    `/api/conversations/${encodeURIComponent(conversationId)}`
  );
}

export type SendMessageRequest = {
  content: string;
  agent_id?: string;
};

export type SendMessageResponse = {
  conversation_id: string;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  orchestration: OrchestrationResponse;
};

export function sendConversationMessage(
  conversationId: string,
  content: string,
  agentId?: string
) {
  return request<SendMessageResponse>(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        content,
        ...(agentId && agentId !== "auto"
          ? { agent_id: agentId }
          : {}),
      } satisfies SendMessageRequest),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Orchestration                                                              */
/* -------------------------------------------------------------------------- */

export type OrchestrationRequest = {
  task: string;
  agent_id?: string;
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
  query?: string;
  status?: string;
  used?: boolean;
  results_count?: number;
  sources?: ResearchSource[];
  error?: string | null;
};

export type ResearchSource = {
  title: string;
  url: string;
  content?: string;
  score?: number;
  published_date?: string | null;
};

export type OrchestrationResult = {
  status?: string;
  output?: string;
  result?: string;
  message?: string;
  error?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  [key: string]: unknown;
};

export type OrchestrationResponse = {
  execution_id?: string;
  request_id?: string;
  status: string;
  task?: string;
  analysis?: OrchestrationAnalysis;
  routing?: OrchestrationRouting;
  selected_agent?: SelectedAgent | null;
  model?: OrchestrationModel;
  search?: OrchestrationSearch;
  result?: OrchestrationResult;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: string;
  message?: string;
};

export function orchestrateTask(task: string, agentId?: string) {
  return request<OrchestrationResponse>("/api/orchestrate", {
    method: "POST",
    body: JSON.stringify({
      task,
      ...(agentId && agentId !== "auto"
        ? { agent_id: agentId }
        : {}),
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
  result: string | null;
  error: string | null;
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

export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  plan?: string;
};

export type CurrentUserResponse = AuthUser;

/**
 * The frontend uses Supabase Auth directly for registration and login.
 * These functions intentionally do not call the retired backend endpoints.
 */
export async function registerUser(_data: {
  name: string;
  email: string;
  password: string;
}): Promise<never> {
  throw new Error(
    "Use Supabase Auth from the frontend to register a new account."
  );
}

export async function loginUser(_data: {
  email: string;
  password: string;
}): Promise<never> {
  throw new Error(
    "Use Supabase Auth from the frontend to sign in."
  );
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

/**
 * Profile changes must be made through Supabase Auth.
 * The backend profile PUT endpoint is intentionally not used.
 */
export async function updateProfile(_data: {
  name: string;
  email: string;
  plan?: string;
}): Promise<UpdateProfileResponse> {
  throw new ApiError(
    "Profile updates must be performed through Supabase Auth.",
    501
  );
}
