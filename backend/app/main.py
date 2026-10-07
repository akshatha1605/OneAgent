import json
from importlib import import_module


try:
    load_dotenv = import_module("dotenv").load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):
        return False


from fastapi import Depends, FastAPI, HTTPException  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware  # pyright: ignore[reportMissingImports]
from pydantic import BaseModel  # pyright: ignore[reportMissingImports]
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session # pyright: ignore[reportMissingImports]

from app.agents.registry import get_all_agents, get_agent
from app.database.database import Base, engine, get_db
from app.database.repository import (
    add_workflow_step,
    create_conversation,
    create_message,
    create_workflow,
    get_conversation,
    get_conversation_messages,
    get_conversations,
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


def _ensure_workflow_step_agent_column() -> None:
    """Add the optional agent column to existing development databases."""

    inspector = inspect(engine)
    columns = {
        column["name"]
        for column in inspector.get_columns("workflow_steps")
    }

    if "agent_id" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE workflow_steps "
                    "ADD COLUMN agent_id TEXT"
                )
            )


_ensure_workflow_step_agent_column()


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


class WorkflowStepCreate(BaseModel):
    name: str
    step_order: int | None = None
    agent_id: str | None = None


class WorkflowStepUpdate(BaseModel):
    name: str | None = None
    step_order: int | None = None
    agent_id: str | None = None


class ConversationCreate(BaseModel):
    title: str = "New Chat"


class ConversationMessageCreate(BaseModel):
    content: str


def _serialize_workflow_step(step):
    current_task = step.task if step.task_id else None
    execution = current_task.execution if current_task else None
    result = current_task.result if current_task else None
    result_payload = None

    if result and result.output:
        try:
            result_payload = json.loads(result.output)
        except json.JSONDecodeError:
            result_payload = result.output

    return {
        "id": step.id,
        "name": step.name,
        "status": step.status,
        "step_order": step.step_order,
        "agent_id": step.agent_id,
        "task_id": step.task_id,
        "selected_agent": execution.agent_id if execution else None,
        "model": execution.model if execution else None,
        "result": result_payload,
        "error": result.error if result else None,
    }


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
# CONVERSATIONS
# ============================================================


@app.post(
    "/api/conversations",
    tags=["Conversations"],
)
async def create_conversation_endpoint(
    request: ConversationCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new persistent conversation.
    """

    title = request.title.strip() or "New Chat"

    conversation = create_conversation(
        db=db,
        title=title,
    )

    return {
        "conversation_id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat(),
        "updated_at": conversation.updated_at.isoformat(),
    }


@app.get(
    "/api/conversations",
    tags=["Conversations"],
)
async def get_conversations_endpoint(
    db: Session = Depends(get_db),
):
    """
    Return conversations for the sidebar.
    """

    conversations = get_conversations(db)

    return {
        "conversations": [
            {
                "conversation_id": conversation.id,
                "title": conversation.title,
                "created_at": conversation.created_at.isoformat(),
                "updated_at": conversation.updated_at.isoformat(),
            }
            for conversation in conversations
        ]
    }


@app.get(
    "/api/conversations/{conversation_id}",
    tags=["Conversations"],
)
async def get_conversation_endpoint(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    """
    Return one conversation with all messages.
    """

    conversation = get_conversation(
        db=db,
        conversation_id=conversation_id,
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    messages = get_conversation_messages(
        db=db,
        conversation_id=conversation_id,
    )

    return {
        "conversation_id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat(),
        "updated_at": conversation.updated_at.isoformat(),
        "messages": [
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "model": message.model,
                "agent_id": message.agent_id,
                "input_tokens": message.input_tokens,
                "output_tokens": message.output_tokens,
                "total_tokens": message.total_tokens,
                "task_id": message.task_id,
                "created_at": message.created_at.isoformat(),
            }
            for message in messages
        ],
    }


@app.post(
    "/api/conversations/{conversation_id}/messages",
    tags=["Conversations"],
)
async def send_conversation_message(
    conversation_id: str,
    request: ConversationMessageCreate,
    db: Session = Depends(get_db),
):
    """
    Send one message through the OneAgent orchestrator.

    Each message gets its own:
    - Task
    - Execution
    - Result
    - Agent
    - Model
    - Token metadata
    """

    conversation = get_conversation(
        db=db,
        conversation_id=conversation_id,
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    content = request.content.strip()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    # --------------------------------------------------------
    # Save USER message
    # --------------------------------------------------------

    user_message = create_message(
        db=db,
        conversation_id=conversation_id,
        role="user",
        content=content,
    )

    try:
        # ----------------------------------------------------
        # Run OneAgent
        # ----------------------------------------------------

        response = await orchestrator.process(
            task=content,
        )

        # ----------------------------------------------------
        # Persist task / execution / result
        # ----------------------------------------------------

        saved_task = save_orchestration(
            db=db,
            task_text=content,
            response=response,
        )

        # ----------------------------------------------------
        # Extract AI metadata
        # ----------------------------------------------------

        selected_agent = response.get("selected_agent") or {}
        model_data = response.get("model") or {}
        result_data = response.get("result") or {}

        model = model_data.get("selected")
        agent_id = selected_agent.get("id")

        # Token usage is provider-dependent.
        usage = (
            response.get("usage")
            or result_data.get("usage")
            or {}
        )

        input_tokens = usage.get(
            "input_tokens",
            usage.get("prompt_tokens"),
        )

        output_tokens = usage.get(
            "output_tokens",
            usage.get("completion_tokens"),
        )

        total_tokens = usage.get("total_tokens")

        if total_tokens is None:
            if input_tokens is not None and output_tokens is not None:
                total_tokens = input_tokens + output_tokens

        # ----------------------------------------------------
        # Extract actual assistant output
        # ----------------------------------------------------

        assistant_content = (
            result_data.get("output")
            or result_data.get("result")
            or result_data.get("message")
            or result_data.get("error")
            or ""
        )

        if not assistant_content:
            assistant_content = str(result_data)

        # ----------------------------------------------------
        # Save ASSISTANT message
        # ----------------------------------------------------

        assistant_message = create_message(
            db=db,
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_content,
            model=model,
            agent_id=agent_id,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            task_id=saved_task.id,
        )

        return {
            "conversation_id": conversation_id,
            "user_message": {
                "id": user_message.id,
                "role": user_message.role,
                "content": user_message.content,
                "created_at": user_message.created_at.isoformat(),
            },
            "assistant_message": {
                "id": assistant_message.id,
                "role": assistant_message.role,
                "content": assistant_message.content,
                "model": assistant_message.model,
                "agent_id": assistant_message.agent_id,
                "input_tokens": assistant_message.input_tokens,
                "output_tokens": assistant_message.output_tokens,
                "total_tokens": assistant_message.total_tokens,
                "task_id": assistant_message.task_id,
                "created_at": assistant_message.created_at.isoformat(),
            },
            "orchestration": response,
        }

    except HTTPException:
        raise
    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


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

    return {
        "workflow_id": workflow.id,
        "task": workflow.task,
        "status": workflow.status,
        "created_at": workflow.created_at.isoformat(),
        "updated_at": workflow.updated_at.isoformat(),
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
                "step_count": len(workflow.steps),
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
        "tasks": [_serialize_workflow_step(step) for step in workflow.steps],
    }


@app.post(
    "/api/workflows/{workflow_id}/steps",
    tags=["Workflows"],
)
async def add_workflow_step_endpoint(
    workflow_id: str,
    step_data: WorkflowStepCreate,
    db: Session = Depends(get_db),
):
    """Add one ordered instruction to a persisted workflow."""

    workflow = get_workflow(db=db, workflow_id=workflow_id)

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    name = step_data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Step instruction cannot be empty")

    configured_agent_id = step_data.agent_id
    if configured_agent_id == "auto":
        configured_agent_id = None
    if configured_agent_id is not None:
        configured_agent_id = configured_agent_id.strip().lower()
        agent = get_agent(configured_agent_id)
        if not agent or agent["status"] != "available":
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid agent_id. Expected one of: "
                    "auto, research, coding, writing, document."
                ),
            )

    step_order = step_data.step_order
    if step_order is None:
        step_order = max(
            (step.step_order for step in workflow.steps),
            default=0,
        ) + 1

    if step_order < 1:
        raise HTTPException(status_code=400, detail="Step order must be at least 1")

    if any(step.step_order == step_order for step in workflow.steps):
        raise HTTPException(status_code=409, detail="Step order already exists")

    step = add_workflow_step(
        db=db,
        workflow=workflow,
        name=name,
        step_order=step_order,
        agent_id=configured_agent_id,
    )

    update_workflow_status(db=db, workflow=workflow, status="queued")

    return _serialize_workflow_step(step)


@app.put(
    "/api/workflows/{workflow_id}/steps/{step_id}",
    tags=["Workflows"],
)
async def update_workflow_step_endpoint(
    workflow_id: str,
    step_id: int,
    step_data: WorkflowStepUpdate,
    db: Session = Depends(get_db),
):
    workflow = get_workflow(db=db, workflow_id=workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    step = next((item for item in workflow.steps if item.id == step_id), None)
    if not step:
        raise HTTPException(status_code=404, detail="Workflow step not found")

    if step_data.name is not None:
        step.name = step_data.name.strip()
        if not step.name:
            raise HTTPException(
                status_code=400,
                detail="Step instruction cannot be empty",
            )

    if "agent_id" in step_data.model_fields_set:
        configured_agent_id = step_data.agent_id
        if configured_agent_id is None or configured_agent_id == "auto":
            configured_agent_id = None
        else:
            configured_agent_id = configured_agent_id.strip().lower()
            agent = get_agent(configured_agent_id)
            if not agent or agent["status"] != "available":
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Invalid agent_id. Expected one of: "
                        "auto, research, coding, writing, document."
                    ),
                )
        step.agent_id = configured_agent_id

    if step_data.step_order is not None:
        if step_data.step_order < 1:
            raise HTTPException(
                status_code=400,
                detail="Step order must be at least 1",
            )
        if any(
            item.id != step.id
            and item.step_order == step_data.step_order
            for item in workflow.steps
        ):
            raise HTTPException(
                status_code=409,
                detail="Step order already exists",
            )
        step.step_order = step_data.step_order

    # Editing invalidates the current execution snapshot, while preserving
    # the historical Task/Execution/Result rows.
    step.status = "queued"
    step.task_id = None
    update_workflow_status(db=db, workflow=workflow, status="queued")
    return _serialize_workflow_step(step)


@app.delete(
    "/api/workflows/{workflow_id}/steps/{step_id}",
    tags=["Workflows"],
)
async def delete_workflow_step_endpoint(
    workflow_id: str,
    step_id: int,
    db: Session = Depends(get_db),
):
    workflow = get_workflow(db=db, workflow_id=workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    step = next((item for item in workflow.steps if item.id == step_id), None)
    if not step:
        raise HTTPException(status_code=404, detail="Workflow step not found")

    remaining_steps = [
        item for item in workflow.steps if item.id != step.id
    ]
    workflow.steps.remove(step)
    db.delete(step)
    db.flush()
    for index, remaining_step in enumerate(
        sorted(remaining_steps, key=lambda item: item.step_order),
        start=1,
    ):
        remaining_step.step_order = index
        remaining_step.status = "queued"
        remaining_step.task_id = None

    update_workflow_status(db=db, workflow=workflow, status="queued")
    return {
        "workflow_id": workflow.id,
        "deleted_step_id": step_id,
        "steps": [_serialize_workflow_step(item) for item in workflow.steps],
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
        if not workflow.steps:
            update_workflow_status(db=db, workflow=workflow, status="failed")
            raise HTTPException(
                status_code=400,
                detail="Workflow must contain at least one step before execution",
            )

        # A rerun starts a fresh current execution while historical task
        # records remain available in the database.
        for step in workflow.steps:
            step.status = "queued"
            step.task_id = None
        db.commit()

        previous_result = None
        final_response = None
        saved_task = None

        for step in workflow.steps:
            step.status = "running"
            db.commit()

            context = (
                {"previous_step_result": previous_result}
                if previous_result is not None
                else None
            )
            process_kwargs = {
                "task": step.name,
                "context": context,
            }
            if step.agent_id:
                process_kwargs["forced_agent_id"] = step.agent_id

            response = await orchestrator.process(**process_kwargs)
            saved_task = save_orchestration(
                db=db,
                task_text=step.name,
                response=response,
            )
            step.task_id = saved_task.id
            final_response = response

            if response.get("status") != "completed":
                step.status = "failed"
                for dependent_step in workflow.steps:
                    if dependent_step.step_order > step.step_order:
                        dependent_step.status = "blocked"
                db.commit()
                break

            step.status = "completed"
            previous_result = response.get("result", {}).get("result")
            db.commit()

        final_status = (
            "completed"
            if final_response and final_response.get("status") == "completed"
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
            "task_id": saved_task.id if saved_task else None,
            "result": final_response,
            "steps": [_serialize_workflow_step(step) for step in workflow.steps],
        }

    except HTTPException:
        raise
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

    for step in reversed(workflow.steps):
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