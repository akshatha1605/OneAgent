
import asyncio
import os
from typing import Any

from dotenv import load_dotenv
from tavily import TavilyClient

from app.search.search_adapter import SearchAdapter, SearchResponse
from app.models.reliability import (
    is_retryable_provider_error,
    provider_timeout_seconds,
    retry_delay_seconds,
)


load_dotenv()


class TavilyAdapter(SearchAdapter):
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("TAVILY_API_KEY")

        if not self.api_key:
            raise RuntimeError("Tavily API key is not configured.")

        self.client = TavilyClient(api_key=self.api_key)

    async def search(
        self,
        query: str,
        context: dict[str, Any] | None = None,
    ) -> SearchResponse:
        if not query or not query.strip():
            raise ValueError("Search query cannot be empty.")

        try:
            response = None
            last_error = None
            for attempt in range(3):
                try:
                    response = await asyncio.wait_for(
                        asyncio.to_thread(
                            self.client.search,
                            query=query,
                            search_depth="advanced",
                            max_results=5,
                        ),
                        timeout=provider_timeout_seconds("tavily"),
                    )
                    break
                except Exception as exc:
                    last_error = exc
                    if not is_retryable_provider_error(exc) or attempt == 2:
                        raise
                    await asyncio.sleep(retry_delay_seconds(attempt))

            if response is None:
                raise last_error or RuntimeError("Tavily returned no response.")

            results = response.get("results", [])

            if not results:
                return {
                    "provider": "tavily",
                    "query": query,
                    "status": "no_results",
                    "used": False,
                    "results": [],
                    "error": None,
                }

            structured_results = []
            for result in results:
                url = str(result.get("url") or "").strip()
                if not url:
                    continue

                structured_results.append(
                    {
                        "title": str(result.get("title") or "").strip(),
                        "url": url,
                        "content": str(result.get("content") or "").strip(),
                        "score": float(result.get("score") or 0.0),
                        "published_date": result.get("published_date"),
                    }
                )

            if not structured_results:
                return {
                    "provider": "tavily",
                    "query": query,
                    "status": "no_results",
                    "used": False,
                    "results": [],
                    "error": None,
                }

            return {
                "provider": "tavily",
                "query": query,
                "status": "completed",
                "used": True,
                "results": structured_results,
                "error": None,
            }

        except Exception as exc:
            raise RuntimeError(
                f"Tavily search failed: {type(exc).__name__}: {exc}"
            ) from exc
