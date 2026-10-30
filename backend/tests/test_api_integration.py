from collections.abc import Generator

import pytest
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import get_current_user
from app.database.database import Base, get_db
from app.database.models import RateLimitBucket
from app.main import app
from app import main as main_module


TEST_USERS = {
    "user-a-token": {"id": "user-a", "email": "a@example.com"},
    "user-b-token": {"id": "user-b", "email": "b@example.com"},
}


@pytest.fixture()
def client(monkeypatch) -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, autoflush=False)

    def override_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    async def override_user(request: Request):
        authorization = request.headers.get("Authorization", "")
        token = authorization.removeprefix("Bearer ").strip()
        if token not in TEST_USERS:
            raise HTTPException(status_code=401, detail="Invalid token")
        return TEST_USERS[token]

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    monkeypatch.setenv("RATE_LIMIT_IP_LIMIT", "10000")
    monkeypatch.setenv("RATE_LIMIT_MESSAGE_LIMIT", "10000")
    monkeypatch.setenv("RATE_LIMIT_ORCHESTRATE_LIMIT", "10000")
    monkeypatch.setenv("RATE_LIMIT_WORKFLOW_LIMIT", "10000")
    monkeypatch.setenv("RATE_LIMIT_API_KEY_LIMIT", "10000")
    monkeypatch.setenv(
        "API_KEY_ENCRYPTION_KEY",
        "oZMZ4xy6E8AbhJxYMZzT91llVR-eZMBc3WBTIhjjeYo=",
    )

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    engine.dispose()


def auth(token: str = "user-a-token") -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_unauthenticated_and_invalid_tokens_are_rejected(client):
    response = client.get("/api/conversations")
    assert response.status_code == 401
    assert response.json()["request_id"]

    response = client.get(
        "/api/conversations",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401


def test_conversation_ownership_and_metadata_reload(client, monkeypatch):
    async def fake_process(**kwargs):
        return {
            "execution_id": "execution-1",
            "status": "completed",
            "selected_agent": {"id": "research"},
            "model": {"selected": "fake"},
            "search": {
                "status": "completed",
                "used": True,
                "results_count": 1,
                "sources": [
                    {
                        "title": "Source",
                        "url": "https://example.com",
                        "content": "Evidence",
                    }
                ],
            },
            "result": {
                "status": "completed",
                "output": "Answer [1]",
                "metadata": {},
            },
        }

    monkeypatch.setattr(main_module.orchestrator, "process", fake_process)
    created = client.post(
        "/api/conversations",
        headers=auth(),
        json={"title": "Research"},
    )
    assert created.status_code == 200
    conversation_id = created.json()["conversation_id"]

    sent = client.post(
        f"/api/conversations/{conversation_id}/messages",
        headers=auth(),
        json={"content": "Research this", "agent_id": "research"},
    )
    assert sent.status_code == 200
    assert sent.json()["assistant_message"]["metadata"]["search"]["sources"]

    loaded = client.get(
        f"/api/conversations/{conversation_id}",
        headers=auth(),
    )
    assert loaded.status_code == 200
    assert loaded.json()["messages"][1]["metadata"]["search"]["sources"]

    forbidden = client.get(
        f"/api/conversations/{conversation_id}",
        headers=auth("user-b-token"),
    )
    assert forbidden.status_code == 404


def test_explicit_and_automatic_orchestration_and_invalid_agent(client, monkeypatch):
    calls = []

    async def fake_process(**kwargs):
        calls.append(kwargs)
        return {
            "execution_id": "execution-2",
            "status": "completed",
            "selected_agent": {"id": kwargs.get("forced_agent_id") or "coding"},
            "model": {"selected": "fake"},
            "result": {"status": "completed", "output": "ok"},
        }

    monkeypatch.setattr(main_module.orchestrator, "process", fake_process)
    explicit = client.post(
        "/api/orchestrate",
        headers=auth(),
        json={"task": "write code", "agent_id": "coding"},
    )
    assert explicit.status_code == 200
    assert calls[-1]["forced_agent_id"] == "coding"

    automatic = client.post(
        "/api/orchestrate",
        headers=auth(),
        json={"task": "write code"},
    )
    assert automatic.status_code == 200
    assert calls[-1]["forced_agent_id"] is None

    invalid = client.post(
        "/api/orchestrate",
        headers=auth(),
        json={"task": "test", "agent_id": "unknown"},
    )
    assert invalid.status_code == 400


def test_workflow_access_and_blocking_failure(client, monkeypatch):
    created = client.post(
        "/api/workflows",
        headers=auth(),
        json={"task": "two steps"},
    )
    workflow_id = created.json()["workflow_id"]

    first = client.post(
        f"/api/workflows/{workflow_id}/steps",
        headers=auth(),
        json={"name": "first", "step_order": 1, "agent_id": "coding"},
    )
    second = client.post(
        f"/api/workflows/{workflow_id}/steps",
        headers=auth(),
        json={"name": "second", "step_order": 2, "agent_id": "coding"},
    )
    assert first.status_code == second.status_code == 200

    calls = []

    async def fake_process(**kwargs):
        calls.append(kwargs["task"])
        return {
            "status": "failed",
            "selected_agent": {"id": "coding"},
            "result": {"status": "failed", "error": "provider failed"},
        }

    monkeypatch.setattr(main_module.orchestrator, "process", fake_process)
    executed = client.post(
        f"/api/workflows/{workflow_id}/execute",
        headers=auth(),
    )
    assert executed.status_code == 200
    assert executed.json()["status"] == "failed"
    assert calls == ["first"]
    assert executed.json()["steps"][0]["status"] == "failed"
    assert executed.json()["steps"][1]["status"] == "blocked"

    forbidden = client.get(
        f"/api/workflows/{workflow_id}",
        headers=auth("user-b-token"),
    )
    assert forbidden.status_code == 404


def test_task_history_and_api_key_response_are_user_scoped(client):
    history = client.get("/api/tasks", headers=auth("user-b-token"))
    assert history.status_code == 200
    assert history.json()["tasks"] == []

    saved = client.put(
        "/api/settings/api-keys/groq",
        headers=auth(),
        json={"api_key": "secret-provider-key"},
    )
    assert saved.status_code == 200
    assert "secret-provider-key" not in saved.text

    statuses = client.get(
        "/api/settings/api-keys",
        headers=auth(),
    )
    assert statuses.status_code == 200
    assert "secret-provider-key" not in statuses.text
    assert next(
        item for item in statuses.json()["providers"]
        if item["provider"] == "groq"
    )["configured"] is True


def test_rate_limit_returns_retry_guidance(client, monkeypatch):
    db = main_module.SessionLocal()
    try:
        db.query(RateLimitBucket).delete()
        db.commit()
    finally:
        db.close()

    async def fake_process(**kwargs):
        return {
            "status": "completed",
            "selected_agent": {"id": "coding"},
            "model": {"selected": "fake"},
            "result": {"status": "completed", "output": "ok"},
        }

    monkeypatch.setattr(main_module.orchestrator, "process", fake_process)
    monkeypatch.setenv("RATE_LIMIT_IP_LIMIT", "1")
    monkeypatch.setenv("RATE_LIMIT_IP_WINDOW_SECONDS", "60")

    first = client.post(
        "/api/orchestrate",
        headers=auth(),
        json={"task": "first"},
    )
    second = client.post(
        "/api/orchestrate",
        headers=auth(),
        json={"task": "second"},
    )

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.headers["Retry-After"]
    assert second.json()["request_id"]


def test_authenticated_rate_limit_is_scoped_to_user(client, monkeypatch):
    async def fake_process(**kwargs):
        return {
            "status": "completed",
            "selected_agent": {"id": "coding"},
            "model": {"selected": "fake"},
            "result": {"status": "completed", "output": "ok"},
        }

    monkeypatch.setattr(main_module.orchestrator, "process", fake_process)
    monkeypatch.setenv("RATE_LIMIT_IP_LIMIT", "10000")
    monkeypatch.setenv("RATE_LIMIT_MESSAGE_LIMIT", "1")
    monkeypatch.setenv("RATE_LIMIT_MESSAGE_WINDOW_SECONDS", "60")

    created = client.post(
        "/api/conversations",
        headers=auth(),
        json={"title": "Rate limit"},
    )
    conversation_id = created.json()["conversation_id"]

    first = client.post(
        f"/api/conversations/{conversation_id}/messages",
        headers=auth(),
        json={"content": "first"},
    )
    second = client.post(
        f"/api/conversations/{conversation_id}/messages",
        headers=auth(),
        json={"content": "second"},
    )

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.headers["Retry-After"]
