
import json
import logging
import os
import time
import uuid
from importlib import import_module

try:
    load_dotenv = import_module("dotenv").load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):
        return False

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.agents.registry import get_all_agents, get_agent
from app.database.database import Base, SessionLocal, engine, get_db, is_sqlite
from app.database import models as db_models
from app.database.migrations import migrate_user_ownership
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
from app.settings_routes import router as settings_router
from app.rate_limit import enforce_ip_rate_limit, enforce_user_rate_limit


logger = logging.getLogger("oneagent.api")


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

# SQLite remains self-initializing for local development and tests. Production
# PostgreSQL schema changes are applied explicitly with Alembic.
if is_sqlite:
    Base.metadata.create_all(bind=engine)
    migrate_user_ownership()


def _ensure_workflow_step_agent_column() -> None:
    inspector = inspect(engine)

    if "workflow_steps" not in inspector.get_table_names():
        return

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


if is_sqlite:
    _ensure_workflow_step_agent_column()


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API-key settings endpoints.
app.include_router(settings_router)


@app.middleware("http")
async def request_observability(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    started = time.perf_counter()
    response = None

    limited_path = (
        request.url.path == "/api/orchestrate"
        or request.url.path.endswith("/messages")
        or request.url.path.endswith("/execute")
        or request.url.path.startswith("/api/settings/api-keys")
    )

    if limited_path:
        db = SessionLocal()
        try:
            retry_after = enforce_ip_rate_limit(db=db, request=request)
        finally:
            db.close()

        if retry_after is not None:
            response = JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please retry shortly.",
                    "request_id": request_id,
                },
                headers={"Retry-After": str(retry_after)},
            )
        else:
            response = await call_next(request)
    else:
        response = await call_next(request)

    duration_ms = round((time.perf_counter() - started) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request_complete request_id=%s method=%s path=%s status=%s duration_ms=%s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    headers = dict(exc.headers or {})
    headers["X-Request-ID"] = request_id
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "request_id": request_id},
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "request_id": request_id,
        },
        headers={"X-Request-ID": request_id},
    )


# ============================================================
# REQUEST MODELS
# ============================================================

class UserProfile(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=320)
    plan: str = Field(default="Free", max_length=50)


class TaskRequest(BaseModel):
    task: str = Field(min_length=1, max_length=20_000)
    agent_id: str | None = Field(default=None, max_length=50)


class WorkflowCreate(BaseModel):
    task: str = Field(min_length=1, max_length=20_000)


class WorkflowStepCreate(BaseModel):
    name: str = Field(min_length=1, max_length=20_000)
    step_order: int | None = Field(default=None, ge=1)
    agent_id: str | None = Field(default=None, max_length=50)


class WorkflowStepUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=20_000)
    step_order: int | None = Field(default=None, ge=1)
    agent_id: str | None = Field(default=None, max_length=50)


class ConversationCreate(BaseModel):
    title: str = Field(default="New Chat", min_length=1, max_length=200)


class ConversationMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=20_000)
    agent_id: str | None = Field(default=None, max_length=50)


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


ALLOWED_CHAT_AGENTS = {
    "research",
    "coding",
    "writing",
    "document",
}


def _normalize_chat_agent(agent_id: str | None) -> str | None:
    if agent_id is None or agent_id.strip().lower() in {"", "auto"}:
        return None

    normalized = agent_id.strip().lower()
    if normalized not in ALLOWED_CHAT_AGENTS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid agent_id. Expected one of: "
                "auto, research, coding, writing, document."
            ),
        )

    return normalized


def _decode_message_metadata(message) -> dict | None:
    if not message.orchestration_metadata:
        return None

    try:
        value = json.loads(message.orchestration_metadata)
    except json.JSONDecodeError:
        return None

    return value if isinstance(value, dict) else None


def _log_execution(
    request: Request,
    response: dict,
    duration_ms: float,
) -> None:
    selected_agent = response.get("selected_agent") or {}
    model = response.get("model") or {}
    search = response.get("search") or {}
    logger.info(
        "execution_complete request_id=%s execution_id=%s status=%s "
        "agent=%s model=%s search_status=%s failure_category=%s "
        "duration_ms=%s",
        getattr(request.state, "request_id", "unknown"),
        response.get("execution_id"),
        response.get("status"),
        selected_agent.get("id"),
        model.get("selected"),
        search.get("status"),
        "orchestration_failed"
        if response.get("status") != "completed"
        else None,
        duration_ms,
    )


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


@app.get("/api/health/live", tags=["System"])
async def liveness():
    return {"status": "alive", "service": "OneAgent API"}


@app.get("/api/health/ready", tags=["System"])
async def readiness():
    checks = {
        "database": False,
        "authentication": bool(
            os.getenv("SUPABASE_URL")
            and os.getenv("SUPABASE_ANON_KEY")
        ),
        "encryption": bool(os.getenv("API_KEY_ENCRYPTION_KEY")),
    }

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        logger.exception("readiness_database_check_failed")

    ready = all(checks.values())
    return JSONResponse(
        status_code=200 if ready else 503,
        content={
            "status": "ready" if ready else "not_ready",
            "service": "OneAgent API",
            "checks": checks,
        },
    )


# ============================================================
# AUTHENTICATION
# ============================================================

@app.post("/api/auth/register", tags=["Authentication"])
async def register():
    raise HTTPException(
        status_code=410,
        detail="Use Supabase Auth from the frontend to register.",
    )


@app.post("/api/auth/login", tags=["Authentication"])
async def login():
    raise HTTPException(
        status_code=410,
        detail="Use Supabase Auth from the frontend to sign in.",
    )


@app.get("/api/auth/me", tags=["Authentication"])
async def current_user(user: dict = Depends(get_current_user)):
    metadata = user.get("user_metadata") or {}

    return {
        "id": user["id"],
        "name": (
            metadata.get("full_name")
            or metadata.get("name")
            or user.get("email", "").split("@")[0]
        ),
        "email": user.get("email"),
        "plan": "Free",
    }


# ============================================================
# USERS
# ============================================================

@app.get("/api/users/profile", tags=["Users"])
async def get_profile(user: dict = Depends(get_current_user)):
    metadata = user.get("user_metadata") or {}

    return {
        "id": user["id"],
        "name": (
            metadata.get("full_name")
            or metadata.get("name")
            or (user.get("email") or "").split("@")[0]
        ),
        "email": user.get("email"),
        "plan": "Free",
    }


@app.put("/api/users/profile", tags=["Users"])
async def update_profile(
    profile: UserProfile,
    user: dict = Depends(get_current_user),
):
    raise HTTPException(
        status_code=501,
        detail=(
            "Profile updates must be implemented through "
            "the Supabase Auth user-update flow."
        ),
    )


# ============================================================
# AGENTS
# ============================================================

@app.get("/api/agents", tags=["Agents"])
async def get_agents_endpoint():
    return {"agents": get_all_agents()}


@app.get("/api/agents/{agent_id}", tags=["Agents"])
async def get_agent_details(agent_id: str):
    agent = get_agent(agent_id)

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return agent


# ============================================================
# CONVERSATIONS
# ============================================================

@app.post("/api/conversations", tags=["Conversations"])
async def create_conversation_endpoint(
    request: ConversationCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    title = request.title.strip() or "New Chat"

    conversation = create_conversation(
        db=db,
        title=title,
        user_id=user["id"],
    )

    return {
        "conversation_id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat(),
        "updated_at": conversation.updated_at.isoformat(),
    }


@app.get("/api/conversations", tags=["Conversations"])
async def get_conversations_endpoint(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    conversations = get_conversations(db, user_id=user["id"])

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


@app.get("/api/conversations/{conversation_id}", tags=["Conversations"])
async def get_conversation_endpoint(
    conversation_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    conversation = get_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=user["id"],
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = get_conversation_messages(
        db=db,
        conversation_id=conversation_id,
        user_id=user["id"],
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
                "metadata": _decode_message_metadata(message),
                "created_at": message.created_at.isoformat(),
            }
            for message in messages
        ],
    }


@app.post(
    "/api/conversations/{conversation_id}/messages",
    tags=["Conversations"],
    dependencies=[Depends(enforce_user_rate_limit("message"))],
)
async def send_conversation_message(
    conversation_id: str,
    request: ConversationMessageCreate,
    http_request: Request,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    conversation = get_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=user["id"],
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    content = request.content.strip()

    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    forced_agent_id = _normalize_chat_agent(request.agent_id)

    user_message = create_message(
        db=db,
        conversation_id=conversation_id,
        role="user",
        content=content,
    )

    try:
        execution_started = time.perf_counter()
        response = await orchestrator.process(
            task=content,
            forced_agent_id=forced_agent_id,
            user_id=user["id"],
            db=db,
        )
        _log_execution(
            http_request,
            response,
            round((time.perf_counter() - execution_started) * 1000, 2),
        )

        saved_task = save_orchestration(
            db=db,
            task_text=content,
            response=response,
            user_id=user["id"],
        )

        selected_agent = response.get("selected_agent") or {}
        model_data = response.get("model") or {}
        result_data = response.get("result") or {}

        model = model_data.get("selected")
        agent_id = selected_agent.get("id")

        usage = response.get("usage") or result_data.get("usage") or {}

        input_tokens = usage.get(
            "input_tokens",
            usage.get("prompt_tokens"),
        )
        output_tokens = usage.get(
            "output_tokens",
            usage.get("completion_tokens"),
        )
        total_tokens = usage.get("total_tokens")

        if (
            total_tokens is None
            and input_tokens is not None
            and output_tokens is not None
        ):
            total_tokens = input_tokens + output_tokens

        assistant_content = (
            result_data.get("output")
            or result_data.get("result")
            or result_data.get("message")
            or result_data.get("error")
            or ""
        )

        if not assistant_content:
            assistant_content = str(result_data)

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
            orchestration_metadata=response,
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
                "metadata": response,
                "created_at": assistant_message.created_at.isoformat(),
            },
            "orchestration": response,
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not process the conversation message.",
        )


# ============================================================
# WORKFLOWS
# ============================================================

@app.post("/api/workflows", tags=["Workflows"])
async def create_workflow_endpoint(
    workflow_data: WorkflowCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if not workflow_data.task.strip():
        raise HTTPException(status_code=400, detail="Task cannot be empty")

    workflow = create_workflow(
        db=db,
        task=workflow_data.task.strip(),
        user_id=user["id"],
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
    user: dict = Depends(get_current_user),
):
    workflows = get_workflows(db, user_id=user["id"])

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


@app.get("/api/workflows/{workflow_id}", tags=["Workflows"])
async def get_workflow_endpoint(
    workflow_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    workflow = get_workflow(
        db=db,
        workflow_id=workflow_id,
        user_id=user["id"],
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return {
        "workflow_id": workflow.id,
        "task": workflow.task,
        "status": workflow.status,
        "created_at": workflow.created_at.isoformat(),
        "updated_at": workflow.updated_at.isoformat(),
        "tasks": [_serialize_workflow_step(step) for step in workflow.steps],
    }


@app.post("/api/workflows/{workflow_id}/steps", tags=["Workflows"])
async def add_workflow_step_endpoint(
    workflow_id: str,
    step_data: WorkflowStepCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    workflow = get_workflow(
        db=db,
        workflow_id=workflow_id,
        user_id=user["id"],
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    name = step_data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Step instruction cannot be empty",
        )

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
    user: dict = Depends(get_current_user),
):
    workflow = get_workflow(
        db=db,
        workflow_id=workflow_id,
        user_id=user["id"],
    )

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
            item.id != step.id and item.step_order == step_data.step_order
            for item in workflow.steps
        ):
            raise HTTPException(
                status_code=409,
                detail="Step order already exists",
            )

        step.step_order = step_data.step_order

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
    user: dict = Depends(get_current_user),
):
    workflow = get_workflow(
        db=db,
        workflow_id=workflow_id,
        user_id=user["id"],
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    step = next((item for item in workflow.steps if item.id == step_id), None)

    if not step:
        raise HTTPException(status_code=404, detail="Workflow step not found")

    remaining_steps = [item for item in workflow.steps if item.id != step.id]

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
    dependencies=[Depends(enforce_user_rate_limit("workflow"))],
)
async def execute_workflow(
    workflow_id: str,
    http_request: Request,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    workflow = get_workflow(
        db=db,
        workflow_id=workflow_id,
        user_id=user["id"],
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    update_workflow_status(db=db, workflow=workflow, status="running")

    try:
        if not workflow.steps:
            update_workflow_status(db=db, workflow=workflow, status="failed")
            raise HTTPException(
                status_code=400,
                detail="Workflow must contain at least one step before execution",
            )

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
                "user_id": user["id"],
                "db": db,
            }

            if step.agent_id:
                process_kwargs["forced_agent_id"] = step.agent_id

            execution_started = time.perf_counter()
            response = await orchestrator.process(**process_kwargs)
            _log_execution(
                http_request,
                response,
                round((time.perf_counter() - execution_started) * 1000, 2),
            )

            saved_task = save_orchestration(
                db=db,
                task_text=step.name,
                response=response,
                user_id=user["id"],
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
    except Exception:
        update_workflow_status(db=db, workflow=workflow, status="failed")

        raise HTTPException(
            status_code=500,
            detail="Workflow execution failed.",
        )


# ============================================================
# ORCHESTRATION
# ============================================================

orchestrator = Orchestrator()


@app.post(
    "/api/orchestrate",
    tags=["Orchestration"],
    dependencies=[Depends(enforce_user_rate_limit("orchestrate"))],
)
async def orchestrate(
    request: TaskRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    execution_started = time.perf_counter()
    response = await orchestrator.process(
        task=request.task,
        forced_agent_id=_normalize_chat_agent(request.agent_id),
        user_id=user["id"],
        db=db,
    )
    _log_execution(
        http_request,
        response,
        round((time.perf_counter() - execution_started) * 1000, 2),
    )

    save_orchestration(
        db=db,
        task_text=request.task,
        response=response,
        user_id=user["id"],
    )

    return response


@app.get(
    "/api/orchestrate/{workflow_id}/status",
    tags=["Orchestration"],
)
async def orchestration_status(
    workflow_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    workflow = get_workflow(
        db=db,
        workflow_id=workflow_id,
        user_id=user["id"],
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    output = None
    error = None

    for step in reversed(workflow.steps):
        if step.task_id and step.task and step.task.result:
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

@app.post("/api/analyze", tags=["Orchestration"])
async def analyze_task(
    request: TaskRequest,
    user: dict = Depends(get_current_user),
):
    analysis = await orchestrator.analyzer.analyze(request.task)
    return analysis.model_dump()


# ============================================================
# TASK HISTORY
# ============================================================

@app.get("/api/tasks", tags=["Tasks"])
async def get_tasks(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    tasks = get_recent_tasks(db, user_id=user["id"])
    task_list = []

    for task in tasks:
        result_text = None
        error_text = None
        metadata = None

        if task.result:
            error_text = task.result.error

            if task.result.output:
                try:
                    parsed = json.loads(task.result.output)

                    if isinstance(parsed, dict):
                        metadata = parsed
                        result_text = (
                            parsed.get("output")
                            or parsed.get("result")
                            or parsed.get("message")
                            or parsed.get("answer")
                        )

                        if result_text is None:
                            result_text = str(parsed)
                    else:
                        result_text = str(parsed)

                except json.JSONDecodeError:
                    result_text = task.result.output

        task_list.append(
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
                "result": result_text,
                "error": error_text,
                "metadata": metadata,
            }
        )

    return {"tasks": task_list}
