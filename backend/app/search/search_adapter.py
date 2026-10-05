from abc import ABC, abstractmethod
from typing import Any, Dict


class SearchAdapter(ABC):
    """
    Common interface for external search providers.
    """

    @abstractmethod
    async def search(
        self,
        query: str,
        context: Dict[str, Any] | None = None
    ) -> str:
        pass