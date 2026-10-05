import uuid
from datetime import datetime

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.agents.registry import get_all_agents, get_agent
from app.database.database import Base, engine, get_db
from app.database.models import Workflow
from app.database.repository import (
    add_workflow_step,
    create_workflow,
    get_recent_tasks,
    get_workflow,
    get_workflows,
    save_orchestration,
    update_workflow_status,
)
from app.orchestrator import Orchestrator


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="OneAgent API",
    version="1.0.0",
    description="Intelligent Multi-Agent AI Orchestration Platform",
)

Base.metadata.create_all(bind=engine)


# ============================================================
# CORS
# ============================================================

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
# REQUEST MODELS
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


@app.get("/api/agents", tags=["Agents"])
async def get_agents():
    return {
        "agents": get_all_agents(),
    }


@app.get("/api/agents/{agent_id}", tags=["Agents"])
async def get_agent_details(agent_id: str):

    agent = get_agent(agent_id)

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    return agent


# ============================================================
# WORKFLOWS
# ============================================================


@app.post("/api/workflows", tags=["Workflows"])
async def create_workflow_endpoint(
    workflow_data: WorkflowCreate,
    db: Session = Depends(get_db),
):
    """
    Create and persist a real workflow.
    """

    if not workflow_data.task.strip():
        raise HTTPException(
            status_code=400,
            detail="Task cannot be empty",
        )

    workflow = create_workflow(
        db=db,
        task=workflow_data.task.strip(),
    )

    # Initial workflow pipeline.
    # These are persisted workflow steps, not hardcoded
    # frontend-only demo data.
    add_workflow_step(
        db=db,
        workflow=workflow,
        name="Task Analysis",
        step_order=1,
    )

    add_workflow_step(
        db=db,
        workflow=workflow,
        name="Agent Selection",
        step_order=2,
    )

    add_workflow_step(
        db=db,
        workflow=workflow,
        name="Execution",
        step_order=3,
    )

    add_workflow_step(
        db=db,
        workflow=workflow,
        name="Result Generation",
        step_order=4,
    )

    return {
        "workflow_id": workflow.id,
        "task": workflow.task,
        "status": workflow.status,
        "created_at": workflow.created_at.isoformat(),
    }


@app.get("/api/workflows", tags=["Workflows"])
async def get_workflows_endpoint(
    db: Session = Depends(get_db),
):
    """
    Return persisted workflows.
    """

    workflows = get_workflows(db)

    return {
        "workflows": [
            {
                "workflow_id": workflow.id,
                "task": workflow.task,
                "status": workflow.status,
                "created_at": workflow.created_at.isoformat(),
                "updated_at": workflow.updated_at.isoformat(),
            }
            for workflow in workflows
        ]
    }


@app.get(
    "/api/workflows/{workflow_id}",
    tags=["Workflows"],
)
async def get_workflow_endpoint(
    workflow_id: str,
    db: Session = Depends(get_db),
):
    """
    Return a persisted workflow and its steps.
    """

    workflow = get_workflow(
        db=db,
        workflow_id=workflow_id,
    )

    if not workflow:
        raise HTTPException(
            status_code=404,
            detail="Workflow not found",
        )

    return {
        "workflow_id": workflow.id,
        "task": workflow.task,
        "status": workflow.status,
        "created_at": workflow.created_at.isoformat(),
        "updated_at": workflow.updated_at.isoformat(),
        "tasks": [
            {
                "id": step.id,
                "name": step.name,
                "status": step.status,
                "step_order": step.step_order,
                "task_id": step.task_id,
            }
            for step in workflow.steps
        ],
    }


@app.post(
    "/api/workflows/{workflow_id}/execute",
    tags=["Workflows"],
)
async def execute_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
):
    """
    Execute the workflow through the real OneAgent orchestrator.
    """

    workflow = get_workflow(
        db=db,
        workflow_id=workflow_id,
    )

    if not workflow:
        raise HTTPException(
            status_code=404,
            detail="Workflow not found",
        )

    update_workflow_status(
        db=db,
        workflow=workflow,
        status="running",
    )

    try:
        # Mark first pipeline step as running.
        if workflow.steps:
            workflow.steps[0].status = "running"
            db.commit()

        response = await orchestrator.process(
            task=workflow.task,
        )

        # Persist the actual orchestration result.
        saved_task = save_orchestration(
            db=db,
            task_text=workflow.task,
            response=response,
        )

        # Mark pipeline steps according to execution result.
        for step in workflow.steps:
            if step.name == "Task Analysis":
                step.status = "completed"

            elif step.name == "Agent Selection":
                step.status = "completed"

            elif step.name == "Execution":
                step.status = (
                    "completed"
                    if response.get("status") == "completed"
                    else "failed"
                )

            elif step.name == "Result Generation":
                step.status = (
                    "completed"
                    if response.get("status") == "completed"
                    else "failed"
                )

            step.task_id = saved_task.id

        final_status = (
            "completed"
            if response.get("status") == "completed"
            else "failed"
        )

        update_workflow_status(
            db=db,
            workflow=workflow,
            status=final_status,
        )

        return {
            "workflow_id": workflow.id,
            "status": final_status,
            "task_id": saved_task.id,
            "result": response,
        }

    except Exception as exc:

        update_workflow_status(
            db=db,
            workflow=workflow,
            status="failed",
        )

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# ORCHESTRATION
# ============================================================


orchestrator = Orchestrator()


@app.post(
    "/api/orchestrate",
    tags=["Orchestration"],
)
async def orchestrate(
    request: TaskRequest,
    db: Session = Depends(get_db),
):
    """
    Execute a task through the OneAgent orchestrator
    and persist the execution result.
    """

    response = await orchestrator.process(
        task=request.task,
    )

    save_orchestration(
        db=db,
        task_text=request.task,
        response=response,
    )

    return response


@app.get(
    "/api/orchestrate/{workflow_id}/status",
    tags=["Orchestration"],
)
async def orchestration_status(
    workflow_id: str,
    db: Session = Depends(get_db),
):
    """
    Return the actual workflow status and AI result.
    """

    workflow = get_workflow(
        db=db,
        workflow_id=workflow_id,
    )

    if not workflow:
        raise HTTPException(
            status_code=404,
            detail="Workflow not found",
        )

    output = None
    error = None

    # Find the task created for this workflow execution.
    for step in workflow.steps:
        if step.task_id and step.task:
            if step.task.result:
                output = step.task.result.output
                error = step.task.result.error
                break

    return {
        "workflow_id": workflow.id,
        "status": workflow.status,
        "result": output,
        "error": error,
    }


# ============================================================
# TASK ANALYSIS
# ============================================================


@app.post(
    "/api/analyze",
    tags=["Orchestration"],
)
async def analyze_task(request: TaskRequest):

    analysis = await orchestrator.analyzer.analyze(
        request.task,
    )

    return analysis.model_dump()


# ============================================================
# TASK HISTORY
# ============================================================


@app.get(
    "/api/tasks",
    tags=["Tasks"],
)
async def get_tasks(
    db: Session = Depends(get_db),
):
    """
    Return recently persisted OneAgent tasks.
    """

    tasks = get_recent_tasks(db)

    return {
        "tasks": [
            {
                "id": task.id,
                "task": task.task_text,
                "status": task.status,
                "created_at": task.created_at.isoformat(),
                "agent": (
                    task.execution.agent_id
                    if task.execution
                    else None
                ),
                "model": (
                    task.execution.model
                    if task.execution
                    else None
                ),
                "confidence": (
                    task.execution.routing_confidence
                    if task.execution
                    else None
                ),
            }
            for task in tasks
        ]
    }