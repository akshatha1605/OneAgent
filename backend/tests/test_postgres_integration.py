import os

import pytest
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.orm import Session

from app.database.models import Conversation


POSTGRES_TEST_DATABASE_URL = os.getenv("POSTGRES_TEST_DATABASE_URL")


@pytest.mark.skipif(
    not POSTGRES_TEST_DATABASE_URL,
    reason="POSTGRES_TEST_DATABASE_URL is not configured",
)
def test_postgres_schema_and_transaction_round_trip():
    assert POSTGRES_TEST_DATABASE_URL is not None
    url = POSTGRES_TEST_DATABASE_URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)

    engine = create_engine(url, pool_pre_ping=True)
    tables = set(inspect(engine).get_table_names())
    assert {"conversations", "rate_limit_buckets", "user_api_keys"} <= tables

    with Session(engine) as session:
        transaction = session.begin()
        conversation = Conversation(
            user_id="postgres-test-user",
            title="transaction-test",
        )
        session.add(conversation)
        session.flush()
        assert session.scalar(
            select(Conversation.id).where(
                Conversation.id == conversation.id,
            )
        ) == conversation.id
        transaction.rollback()
        assert session.scalar(
            select(Conversation.id).where(
                Conversation.id == conversation.id,
            )
        ) is None

    engine.dispose()
