import json
from datetime import datetime

from sqlalchemy.orm import Session

from app.database.models import (
    Execution,
    Result,
    Task,
    Workflow,
    WorkflowStep,
)


# ============================================================
# TASK / ORCHESTRATION
# ============================================================


def save_orchestration(
    db: Session,
    task_text: str,
    response: dict,
) -> Task:

    task = Task(
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
        output=json.dumps(result_data),
        error=result_data.get("error"),
    )

    db.add(execution)
    db.add(result)

    db.commit()
    db.refresh(task)

    return task


def get_recent_tasks(
    db: Session,
    limit: int = 20,
):
    return (
        db.query(Task)
        .order_by(Task.created_at.desc())
        .limit(limit)
        .all()
    )


# ============================================================
# WORKFLOWS
# ============================================================


def create_workflow(
    db: Session,
    task: str,
) -> Workflow:

    workflow = Workflow(
        task=task,
        status="queued",
    )

    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    return workflow


def get_workflows(
    db: Session,
    limit: int = 50,
):
    return (
        db.query(Workflow)
        .order_by(Workflow.created_at.desc())
        .limit(limit)
        .all()
    )


def get_workflow(
    db: Session,
    workflow_id: str,
):
    return (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id)
        .first()
    )


def add_workflow_step(
    db: Session,
    workflow: Workflow,
    name: str,
    step_order: int,
) -> WorkflowStep:

    step = WorkflowStep(
        workflow_id=workflow.id,
        name=name,
        step_order=step_order,
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