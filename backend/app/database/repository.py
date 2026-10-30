
import json
from datetime import datetime
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import joinedload, selectinload

Session = Any

from app.database.models import (
    Conversation,
    Execution,
    Message,
    Result,
    Task,
    Workflow,
    WorkflowStep,
)


# ============================================================
# CONVERSATIONS
# ============================================================


def create_conversation(
    db: Session,
    user_id: str,
    title: str = "New Chat",
) -> Conversation:
    conversation = Conversation(
        user_id=user_id,
        title=title,
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


def get_conversations(
    db: Session,
    user_id: str,
    limit: int = 50,
):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .limit(limit)
        .all()
    )


def get_conversation(
    db: Session,
    conversation_id: int,
    user_id: str,
):
    return (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        .first()
    )


def update_conversation_title(
    db: Session,
    conversation: Conversation,
    title: str,
):
    conversation.title = title
    conversation.updated_at = datetime.utcnow()

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


# ============================================================
# MESSAGES
# ============================================================


def create_message(
    db: Session,
    conversation_id: int,
    role: str,
    content: str,
    model: str | None = None,
    agent_id: str | None = None,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    total_tokens: int | None = None,
    task_id: str | None = None,
    orchestration_metadata: dict[str, Any] | None = None,
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        model=model,
        agent_id=agent_id,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        task_id=task_id,
        orchestration_metadata=(
            json.dumps(orchestration_metadata)
            if orchestration_metadata is not None
            else None
        ),
    )

    db.add(message)

    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if conversation:
        conversation.updated_at = datetime.utcnow()
        db.add(conversation)

    db.commit()
    db.refresh(message)

    return message


def get_conversation_messages(
    db: Session,
    conversation_id: int,
    user_id: str,
):
    return (
        db.query(Message)
        .join(
            Conversation,
            Message.conversation_id == Conversation.id,
        )
        .filter(
            Message.conversation_id == conversation_id,
            Conversation.user_id == user_id,
        )
        .order_by(Message.created_at.asc())
        .all()
    )


# ============================================================
# TASK / ORCHESTRATION
# ============================================================


def save_orchestration(
    db: Session,
    task_text: str,
    response: dict,
    user_id: str,
) -> Task:
    task = Task(
        user_id=user_id,
        task_text=task_text,
        status=response.get("status", "failed"),
    )

    db.add(task)
    db.flush()

    routing = response.get("routing", {})
    selected_agent = response.get("selected_agent") or {}
    model_data = response.get("model") or {}
    search_data = response.get("search") or {}
    result_data = response.get("result") or {}

    execution = Execution(
        task_id=task.id,
        agent_id=selected_agent.get("id"),
        model=model_data.get("selected"),
        routing_method=routing.get("method"),
        routing_confidence=routing.get("confidence"),
        fallback_used=model_data.get("fallback_used", False),
        search_provider=search_data.get("provider"),
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )

    result = Result(
        task_id=task.id,
        status=result_data.get(
            "status",
            response.get("status", "failed"),
        ),
        output=json.dumps(
            {
                **result_data,
                "execution_id": response.get("execution_id"),
            }
        ),
        error=result_data.get("error"),
    )

    db.add(execution)
    db.add(result)

    db.commit()
    db.refresh(task)

    return task


def get_recent_tasks(
    db: Session,
    user_id: str,
    limit: int = 20,
    offset: int = 0,
):
    return (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .options(
            joinedload(Task.execution),
            joinedload(Task.result),
        )
        .order_by(Task.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def count_tasks(db: Session, user_id: str) -> int:
    return (
        db.query(func.count(Task.id))
        .filter(Task.user_id == user_id)
        .scalar()
        or 0
    )


def get_task(db: Session, task_id: int, user_id: str):
    return (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == user_id)
        .options(
            joinedload(Task.execution),
            joinedload(Task.result),
        )
        .first()
    )


def get_weekly_usage(db: Session, user_id: str, week_start: datetime):
    task_count = (
        db.query(func.count(Task.id))
        .filter(
            Task.user_id == user_id,
            Task.created_at >= week_start,
        )
        .scalar()
        or 0
    )
    workflow_count = (
        db.query(func.count(Workflow.id))
        .filter(
            Workflow.user_id == user_id,
            Workflow.created_at >= week_start,
        )
        .scalar()
        or 0
    )
    return {
        "weekly_agent_calls": task_count,
        "weekly_workflows": workflow_count,
    }


# ============================================================
# WORKFLOWS
# ============================================================


def create_workflow(
    db: Session,
    task: str,
    user_id: str,
) -> Workflow:
    workflow = Workflow(
        user_id=user_id,
        task=task,
        status="queued",
    )

    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    return workflow


def get_workflows(
    db: Session,
    user_id: str,
    limit: int = 50,
):
    return (
        db.query(Workflow)
        .filter(Workflow.user_id == user_id)
        .options(selectinload(Workflow.steps))
        .order_by(Workflow.created_at.desc())
        .limit(limit)
        .all()
    )


def get_workflow(
    db: Session,
    workflow_id: str,
    user_id: str,
):
    return (
        db.query(Workflow)
        .filter(
            Workflow.id == workflow_id,
            Workflow.user_id == user_id,
        )
        .first()
    )


def add_workflow_step(
    db: Session,
    workflow: Workflow,
    name: str,
    step_order: int,
    agent_id: str | None = None,
) -> WorkflowStep:
    step = WorkflowStep(
        workflow_id=workflow.id,
        name=name,
        step_order=step_order,
        agent_id=agent_id,
        status="queued",
    )

    db.add(step)
    db.commit()
    db.refresh(step)

    return step


def update_workflow_status(
    db: Session,
    workflow: Workflow,
    status: str,
):
    workflow.status = status
    workflow.updated_at = datetime.utcnow()

    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    return workflow


def update_workflow_step(
    db: Session,
    step: WorkflowStep,
    status: str,
    task_id: str | None = None,
):
    step.status = status

    if task_id is not None:
        step.task_id = task_id

    db.add(step)
    db.commit()
    db.refresh(step)

    return step
