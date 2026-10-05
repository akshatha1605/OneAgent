import os
from typing import Dict, Type

from app.models.model_adapter import ModelAdapter
from app.models.gemini_adapter import GeminiAdapter
from app.models.groq_adapter import GroqAdapter

try:
    from app.models.openai_adapter import OpenAIAdapter
except ImportError:
    OpenAIAdapter = None


class ModelRegistry:
    """
    Central registry for available LLM providers.

    Providers are optional and are considered available only
    when their required API key is configured.
    """

    def __init__(self):
        self._models: Dict[str, Type[ModelAdapter]] = {
            "gemini": GeminiAdapter,
            "groq": GroqAdapter,
        }

        if OpenAIAdapter is not None:
            self._models["openai"] = OpenAIAdapter

    def get(self, provider: str) -> ModelAdapter:
        provider = provider.lower().strip()

        model_class = self._models.get(provider)

        if not model_class:
            available = ", ".join(self.list_available_providers())

            raise ValueError(
                f"Model provider '{provider}' is unavailable. "
                f"Available providers: {available}"
            )

        return model_class()

    def list_providers(self) -> list[str]:
        return list(self._models.keys())

    def list_available_providers(self) -> list[str]:
        available = []

        key_mapping = {
            "gemini": "GEMINI_API_KEY",
            "groq": "GROQ_API_KEY",
            "openai": "OPENAI_API_KEY",
        }

        for provider in self._models:
            env_name = key_mapping.get(provider)

            if env_name and os.getenv(env_name):
                available.append(provider)

        return available

    def register(
        self,
        name: str,
        model_class: Type[ModelAdapter]
    ) -> None:

        if not issubclass(model_class, ModelAdapter):
            raise TypeError(
                "Model provider must extend ModelAdapter."
            )

        self._models[
            name.lower().strip()
        ] = model_class