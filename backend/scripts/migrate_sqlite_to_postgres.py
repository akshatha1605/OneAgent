"""Copy existing SQLite rows into an already-migrated PostgreSQL database.

This script is intentionally dry-run by default. Run Alembic against the
target first, validate the dry-run counts, then pass --apply explicitly.
"""
import argparse
import os
import sqlite3
from pathlib import Path

from sqlalchemy import create_engine, inspect, text


TABLE_ORDER = (
    "conversations",
    "tasks",
    "workflows",
    "messages",
    "executions",
    "results",
    "workflow_steps",
    "user_api_keys",
)


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        default="oneagent.db",
        help="Path to the SQLite database.",
    )
    parser.add_argument(
        "--target",
        default=os.getenv("DATABASE_URL"),
        help="Target PostgreSQL DATABASE_URL.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply the copy. Without this flag the script only reports counts.",
    )
    args = parser.parse_args()

    if not args.target:
        raise SystemExit("Set DATABASE_URL or pass --target.")

    source_path = Path(args.source).resolve()
    if not source_path.exists():
        raise SystemExit(f"SQLite source does not exist: {source_path}")

    target_engine = create_engine(
        normalize_database_url(args.target),
        pool_pre_ping=True,
    )
    target_tables = set(inspect(target_engine).get_table_names())

    with sqlite3.connect(source_path) as source:
        source_tables = {
            row[0]
            for row in source.execute(
                "SELECT name FROM sqlite_master "
                "WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
        }

        plan = []
        for table in TABLE_ORDER:
            if table not in source_tables:
                continue
            if table not in target_tables:
                raise SystemExit(
                    f"Target table '{table}' is missing. Run 'alembic upgrade head'."
                )
            count = source.execute(
                f'SELECT COUNT(*) FROM "{table}"'
            ).fetchone()[0]
            plan.append((table, count))

        print("Migration plan:")
        for table, count in plan:
            print(f"  {table}: {count} rows")

        if not args.apply:
            print("Dry run only. Re-run with --apply to copy rows.")
            return

        with target_engine.begin() as target:
            for table, _ in plan:
                columns = [
                    column["name"]
                    for column in inspect(target_engine).get_columns(table)
                ]
                source_columns = [
                    column[1]
                    for column in source.execute(
                        f'PRAGMA table_info("{table}")'
                    ).fetchall()
                ]
                common = [column for column in source_columns if column in columns]
                quoted_columns = ", ".join(f'"{column}"' for column in common)
                placeholders = ", ".join(f":{column}" for column in common)
                rows = source.execute(
                    f'SELECT {quoted_columns} FROM "{table}"'
                ).fetchall()

                if rows:
                    target.execute(
                        text(
                            f'INSERT INTO "{table}" ({quoted_columns}) '
                            f"VALUES ({placeholders})"
                        ),
                        [dict(zip(common, row)) for row in rows],
                    )

            for table in (
                "conversations",
                "tasks",
                "workflows",
                "messages",
                "executions",
                "results",
                "workflow_steps",
                "user_api_keys",
            ):
                target.execute(
                    text(
                        "SELECT setval("
                        "pg_get_serial_sequence(:table_name, 'id'), "
                        "COALESCE((SELECT MAX(id) FROM "
                        f'"{table}"), 1), '
                        "COALESCE((SELECT MAX(id) FROM "
                        f'"{table}"), 1), '
                        f'(SELECT MAX(id) FROM "{table}") IS NOT NULL)'
                    ),
                    {"table_name": table},
                )

        print("Migration applied successfully.")


if __name__ == "__main__":
    main()
