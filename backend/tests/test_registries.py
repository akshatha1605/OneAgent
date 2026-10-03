from app.agents.registry import (
    get_all_agents,
    get_agent,
    find_agents_by_capability,
)
from app.models.model_registry import ModelRegistry
from app.search.search_registry import SearchRegistry


def test_agent_registry_contains_core_agents():
    agents = get_all_agents()
    agent_ids = {agent["id"] for agent in agents}

    assert {"coding", "research", "writing", "document"} <= agent_ids


def test_get_agent():
    agent = get_agent("coding")

    assert agent is not None
    assert agent["id"] == "coding"
    assert agent["status"] == "available"


def test_find_agents_by_capability():
    matches = find_agents_by_capability("programming")

    assert any(agent["id"] == "coding" for agent in matches)


def test_model_registry_contains_providers():
    registry = ModelRegistry()

    providers = registry.list_providers()

    assert "gemini" in providers
    assert "groq" in providers
    assert "openai" in providers


def test_search_registry_contains_tavily():
    registry = SearchRegistry()

    providers = registry.list_providers()

    assert "tavily" in providers
