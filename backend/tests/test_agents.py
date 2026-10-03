import pytest

from app.agents.coding_agent import CodingAgent
from app.agents.document_agent import DocumentAgent
from app.agents.writing_agent import WritingAgent
from app.agents.research_agent import ResearchAgent
from app.models.model_adapter import ModelAdapter


class FakeModel(ModelAdapter):

    async def generate(self, prompt, context=None):
        return "Fake model response"


class FakeSearch:

    async def search(self, query, context=None):
        return (
            "Title: Example Research Paper\n"
            "URL: https://example.com\n"
            "Content: Example research content"
        )


@pytest.mark.asyncio
async def test_coding_agent():
    agent = CodingAgent(model=FakeModel())

    result = await agent.execute(
        "Write a Python hello world program"
    )

    assert result["status"] == "completed"
    assert result["agent_id"] == "coding"
    assert result["result"] == "Fake model response"


@pytest.mark.asyncio
async def test_writing_agent():
    agent = WritingAgent(model=FakeModel())

    result = await agent.execute(
        "Write a short project introduction"
    )

    assert result["status"] == "completed"
    assert result["agent_id"] == "writing"


@pytest.mark.asyncio
async def test_document_agent():
    agent = DocumentAgent(model=FakeModel())

    result = await agent.execute(
        "Prepare project documentation"
    )

    assert result["status"] == "completed"
    assert result["agent_id"] == "document"


@pytest.mark.asyncio
async def test_research_agent():
    agent = ResearchAgent(
        model=FakeModel(),
        search=FakeSearch(),
    )

    result = await agent.execute(
        "Research AI intrusion detection"
    )

    assert result["status"] == "completed"
    assert result["agent_id"] == "research"
    assert result["metadata"]["web_search_used"] is True
