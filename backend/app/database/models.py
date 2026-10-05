import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(
        Text,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    task_text: Mapped[str] = mapped_column(Text, nullable=False)

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