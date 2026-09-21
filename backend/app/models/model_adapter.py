from abc import ABC, abstractmethod
from typing import Any, Dict


class ModelAdapter(ABC):
    """
    Common interface for all AI model providers.
    """

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        context: Dict[str, Any] | None = None
    ) -> str:
        pass