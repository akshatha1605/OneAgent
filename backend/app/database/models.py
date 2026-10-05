import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


# ============================================================
# WORKFLOW
# ============================================================


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(
        Text,
        primary_key=True,
        default=lambda: f"wf_{uuid.uuid4().hex[:8]}",
    )

    task: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        Text,
        default="queued",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    steps: Mapped[list["WorkflowStep"]] = relationship(
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.step_order",
    )


# ============================================================
# WORKFLOW STEP
# ============================================================


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    workflow_id: Mapped[str] = mapped_column(
        ForeignKey("workflows.id"),
        nullable=False,
    )

    task_id: Mapped[str | None] = mapped_column(
        ForeignKey("tasks.id"),
        nullable=True,
    )

    step_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        Text,
        default="queued",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    workflow: Mapped["Workflow"] = relationship(
        back_populates="steps",
    )

    task: Mapped["Task | None"] = relationship()


# ============================================================
# TASK
# ============================================================


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(
        Text,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    task_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        Text,
        default="pending",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    execution: Mapped["Execution | None"] = relationship(
        back_populates="task",
        uselist=False,
        cascade="all, delete-orphan",
    )

    result: Mapped["Result | None"] = relationship(
        back_populates="task",
        uselist=False,
        cascade="all, delete-orphan",
    )


# ============================================================
# EXECUTION
# ============================================================


class Execution(Base):
    __tablename__ = "executions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    task_id: Mapped[str] = mapped_column(
        ForeignKey("tasks.id"),
        nullable=False,
        unique=True,
    )

    agent_id: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    model: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    routing_method: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    routing_confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    fallback_used: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    search_provider: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    completed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    task: Mapped["Task"] = relationship(
        back_populates="execution",
    )


# ============================================================
# RESULT
# ============================================================


class Result(Base):
    __tablename__ = "results"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    task_id: Mapped[str] = mapped_column(
        ForeignKey("tasks.id"),
        nullable=False,
        unique=True,
    )

    status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    output: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    task: Mapped["Task"] = relationship(
        back_populates="result",
    )