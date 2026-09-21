from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="OneAgent API",
    version="1.0.0",
    description="Intelligent Multi-Agent AI Orchestration Platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# MODELS
# ============================================================

class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    name: str
    email: str
    plan: str = "Free"


class TaskRequest(BaseModel):
    task: str


class WorkflowCreate(BaseModel):
    task: str


# ============================================================
# SYSTEM
# ============================================================

@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Welcome to OneAgent 🚀",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/api/health", tags=["System"])
async def health():
    return {
        "status": "healthy",
        "service": "OneAgent API",
    }


# ============================================================
# AUTHENTICATION
# ============================================================

@app.post("/api/auth/register", tags=["Authentication"])
async def register(user: UserRegister):
    return {
        "message": "User registered successfully",
        "user": {
            "name": user.name,
            "email": user.email,
        },
    }


@app.post("/api/auth/login", tags=["Authentication"])
async def login(user: UserLogin):
    return {
        "message": "Login successful",
        "access_token": "demo-token",
        "token_type": "bearer",
    }


@app.get("/api/auth/me", tags=["Authentication"])
async def current_user():
    return {
        "id": "user_001",
        "name": "Demo User",
        "email": "user@oneagent.ai",
        "plan": "Free",
    }


# ============================================================
# USERS
# ============================================================

@app.get("/api/users/profile", tags=["Users"])
async def get_profile():
    return {
        "id": "user_001",
        "name": "Demo User",
        "email": "user@oneagent.ai",
        "plan": "Free",
    }


@app.put("/api/users/profile", tags=["Users"])
async def update_profile(profile: UserProfile):
    return {
        "message": "Profile updated successfully",
        "profile": profile,
    }


# ============================================================
# AGENTS
# ============================================================

AGENTS = [
    {
        "id": "gemini",
        "name": "Gemini",
        "type": "General AI",
        "plan": "Free",
        "status": "available",
    },
    {
        "id": "research",
        "name": "Research Agent",
        "type": "Web Research",
        "plan": "Free",
        "status": "available",
    },
    {
        "id": "coding",
        "name": "Code Agent",
        "type": "Programming",
        "plan": "Free",
        "status": "available",
    },
    {
        "id": "gpt-advanced",
        "name": "Advanced GPT",
        "type": "Advanced Reasoning",
        "plan": "Pro",
        "status": "premium",
    },
]


@app.get("/api/agents", tags=["Agents"])
async def get_agents():
    return {
        "agents": AGENTS
    }


@app.get("/api/agents/{agent_id}", tags=["Agents"])
async def get_agent(agent_id: str):
    for agent in AGENTS:
        if agent["id"] == agent_id:
            return agent

    return {
        "error": "Agent not found"
    }


# ============================================================
# WORKFLOWS
# ============================================================

@app.post("/api/workflows", tags=["Workflows"])
async def create_workflow(workflow: WorkflowCreate):

    workflow_id = f"wf_{uuid.uuid4().hex[:8]}"

    return {
        "workflow_id": workflow_id,
        "task": workflow.task,
        "status": "queued",
        "created_at": datetime.now().isoformat(),
    }


@app.get("/api/workflows", tags=["Workflows"])
async def get_workflows():
    return {
        "workflows": [
            {
                "workflow_id": "wf_001",
                "task": "Prepare competitor analysis",
                "status": "running",
            },
            {
                "workflow_id": "wf_002",
                "task": "Create project documentation",
                "status": "completed",
            },
            {
                "workflow_id": "wf_003",
                "task": "Analyze source code",
                "status": "failed",
            },
        ]
    }


@app.get("/api/workflows/{workflow_id}", tags=["Workflows"])
async def get_workflow(workflow_id: str):
    return {
        "workflow_id": workflow_id,
        "status": "running",
        "tasks": [
            {
                "name": "Research",
                "status": "completed",
            },
            {
                "name": "Analysis",
                "status": "running",
            },
            {
                "name": "Report Generation",
                "status": "queued",
            },
        ],
    }


@app.post("/api/workflows/{workflow_id}/execute", tags=["Workflows"])
async def execute_workflow(workflow_id: str):
    return {
        "workflow_id": workflow_id,
        "status": "running",
        "message": "Workflow execution started",
    }


# ============================================================
# ORCHESTRATION
# ============================================================

@app.post("/api/orchestrate", tags=["Orchestration"])
async def orchestrate(request: TaskRequest):

    task = request.task.lower()

    selected_agents = []

    if any(word in task for word in ["code", "coding", "program", "debug"]):
        selected_agents.append("coding")

    if any(word in task for word in ["research", "find", "latest", "search"]):
        selected_agents.append("research")

    if not selected_agents:
        selected_agents.append("gemini")

    workflow_id = f"wf_{uuid.uuid4().hex[:8]}"

    return {
        "workflow_id": workflow_id,
        "task": request.task,
        "status": "processing",
        "selected_agents": selected_agents,
        "message": "OneAgent has analyzed the task and selected suitable agents.",
    }


@app.get(
    "/api/orchestrate/{workflow_id}/status",
    tags=["Orchestration"],
)
async def orchestration_status(workflow_id: str):

    return {
        "workflow_id": workflow_id,
        "status": "completed",
        "result": "Task processing completed successfully.",
    }