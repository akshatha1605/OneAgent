import json
from datetime import datetime

from sqlalchemy.orm import Session

from app.database.models import Execution, Result, Task


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