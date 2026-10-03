import pytest

from app.analyzer.task_analyzer import TaskAnalyzer


@pytest.fixture(scope="module")
def analyzer():
    return TaskAnalyzer()


@pytest.mark.asyncio
async def test_analyzer_routes_coding_task(analyzer):
    result = await analyzer.analyze(
        "Write a Python program to sort a list of numbers"
    )

    assert result.recommended_agent == "coding"
    assert result.task_type == "programming"
    assert result.routing_method == "semantic"
    assert 0.0 <= result.confidence <= 1.0


@pytest.mark.asyncio
async def test_analyzer_routes_research_task(analyzer):
    result = await analyzer.analyze(
        "Research recent papers about artificial intelligence"
    )

    assert result.recommended_agent == "research"
    assert result.task_type == "research"
    assert 0.0 <= result.confidence <= 1.0


@pytest.mark.asyncio
async def test_analyzer_routes_writing_task(analyzer):
    result = await analyzer.analyze(
        "Rewrite this paragraph to make it more engaging and natural"
    )

    assert result.recommended_agent == "writing"
    assert result.task_type == "writing"
    assert 0.0 <= result.confidence <= 1.0


@pytest.mark.asyncio
async def test_analyzer_rejects_empty_task(analyzer):
    with pytest.raises(ValueError):
        await analyzer.analyze("")
