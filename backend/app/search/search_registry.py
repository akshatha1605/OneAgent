
from app.search.search_adapter import SearchAdapter
from app.search.tavily_adapter import TavilyAdapter


class SearchRegistry:
    def __init__(self):
        self._providers = {
            "tavily": TavilyAdapter,
        }

    def get(
        self,
        provider: str,
        api_key: str | None = None,
    ) -> SearchAdapter:
        provider = provider.lower().strip()
        provider_class = self._providers.get(provider)

        if provider_class is None:
            available = ", ".join(self._providers.keys())
            raise ValueError(
                f"Unsupported search provider '{provider}'. "
                f"Available providers: {available}"
            )

        return provider_class(api_key=api_key)

    def list_providers(self) -> list[str]:
        return list(self._providers.keys())
