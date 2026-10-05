from typing import Dict, Type

from app.search.search_adapter import SearchAdapter
from app.search.tavily_adapter import TavilyAdapter


class SearchRegistry:
    """
    Central registry for available search providers.
    """

    def __init__(self):
        self._providers: Dict[
            str,
            Type[SearchAdapter]
        ] = {
            "tavily": TavilyAdapter,
        }

    def get(self, provider: str) -> SearchAdapter:
        provider = provider.lower().strip()

        provider_class = self._providers.get(provider)

        if not provider_class:
            available = ", ".join(self._providers.keys())

            raise ValueError(
                f"Unknown search provider '{provider}'. "
                f"Available providers: {available}"
            )

        return provider_class()

    def list_providers(self) -> list[str]:
        return list(self._providers.keys())

    def register(
        self,
        name: str,
        provider_class: Type[SearchAdapter]
    ) -> None:

        if not issubclass(provider_class, SearchAdapter):
            raise TypeError(
                "Search provider must extend SearchAdapter."
            )

        self._providers[
            name.lower().strip()
        ] = provider_class