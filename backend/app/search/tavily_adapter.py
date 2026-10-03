import asyncio
import os
from typing import Any, Dict

from dotenv import load_dotenv
from tavily import TavilyClient

from app.search.search_adapter import SearchAdapter


load_dotenv()


class TavilyAdapter(SearchAdapter):
    """
    Web search adapter using Tavily.

    Primarily intended for research-oriented tasks such as:
    - research papers
    - research articles
    - current information
    - fact finding
    """

    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "TAVILY_API_KEY is not configured."
            )

        self.client = TavilyClient(
            api_key=self.api_key
        )

    async def search(
        self,
        query: str,
        context: Dict[str, Any] | None = None
    ) -> str:

        try:
            response = await asyncio.to_thread(
                self.client.search,
                query=query,
                search_depth="advanced",
                max_results=5
            )

            results = response.get("results", [])

            if not results:
                return "No search results found."

            formatted_results = []

            for result in results:
                title = result.get("title", "")
                url = result.get("url", "")
                content = result.get("content", "")

                formatted_results.append(
                    f"Title: {title}\n"
                    f"URL: {url}\n"
                    f"Content: {content}"
                )

            return "\n\n---\n\n".join(formatted_results)

        except Exception as e:
            raise RuntimeError(
                f"Tavily search failed: "
                f"{type(e).__name__}: {e}"
            ) from e