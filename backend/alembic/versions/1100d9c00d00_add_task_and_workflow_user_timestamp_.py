
"""add task and workflow user timestamp indexes

Revision ID: 1100d9c00d00
Revises: 0001_initial_schema
Create Date: 2026-10-31 00:24:06.082626
"""

from typing import Sequence, Union

from alembic import op

revision: str = "1100d9c00d00"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_tasks_user_created_at",
        "tasks",
        ["user_id", "created_at"],
        unique=False,
    )

    op.create_index(
        "ix_workflows_user_created_at",
        "workflows",
        ["user_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_workflows_user_created_at",
        table_name="workflows",
    )

    op.drop_index(
        "ix_tasks_user_created_at",
        table_name="tasks",
    )
