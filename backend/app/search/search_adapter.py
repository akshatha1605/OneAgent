from abc import ABC, abstractmethod
from typing import Any, Literal, TypedDict


class SearchSource(TypedDict, total=False):
    title: str
    url: str
    content: str
    score: float
    published_date: str | None


SearchStatus = Literal[
    "completed",
    "no_results",
    "missing_key",
    "timeout",
    "failed",
    "not_requested",
    "not_run",
]


class SearchResponse(TypedDict):
    provider: str
    query: str
    status: SearchStatus
    used: bool
    results: list[SearchSource]
    error: str | None


class SearchAdapter(ABC):
    """
    Common interface for external search providers.
    """

    @abstractmethod
    async def search(
        self,
        query: str,
        context: dict[str, Any] | None = None,
    ) -> SearchResponse:
        pass