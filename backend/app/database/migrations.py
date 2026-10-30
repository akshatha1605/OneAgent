from sqlalchemy import inspect, text

from app.database.database import engine


def migrate_user_ownership() -> None:
    """
    Add nullable user ownership columns to existing tables.

    Existing records remain unassigned (user_id = NULL).
    This migration is safe to run multiple times.
    """

    ownership_tables = (
        "conversations",
        "workflows",
        "tasks",
    )

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as connection:
        for table in ownership_tables:
            if table not in existing_tables:
                continue

            columns = {
                column["name"]
                for column in inspect(connection).get_columns(table)
            }

            if "user_id" not in columns:
                connection.execute(
                    text(
                        f"ALTER TABLE {table} "
                        "ADD COLUMN user_id TEXT"
                    )
                )

                connection.execute(
                    text(
                        f"CREATE INDEX IF NOT EXISTS "
                        f"ix_{table}_user_id "
                        f"ON {table} (user_id)"
                    )
                )

        if "messages" in existing_tables:
            message_columns = {
                column["name"]
                for column in inspect(connection).get_columns("messages")
            }

            if "orchestration_metadata" not in message_columns:
                connection.execute(
                    text(
                        "ALTER TABLE messages "
                        "ADD COLUMN orchestration_metadata TEXT"
                    )
                )