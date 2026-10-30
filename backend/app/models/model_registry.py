
import os

from app.models.model_adapter import ModelAdapter
from app.models.gemini_adapter import GeminiAdapter
from app.models.groq_adapter import GroqAdapter
from app.models.grok_adapter import GrokAdapter
from app.models.openai_adapter import OpenAIAdapter


class ModelRegistry:
    def __init__(self):
        self._models = {
            "openai": OpenAIAdapter,
            "gemini": GeminiAdapter,
            "groq": GroqAdapter,
            "grok": GrokAdapter,
        }

    def get(
        self,
        provider: str,
        api_key: str | None = None,
    ) -> ModelAdapter:
        provider = provider.lower().strip()
        model_class = self._models.get(provider)

        if model_class is None:
            available = ", ".join(self._models.keys())
            raise ValueError(
                f"Unsupported model provider '{provider}'. "
                f"Available providers: {available}"
            )

        return model_class(api_key=api_key)

    def list_providers(self) -> list[str]:
        return list(self._models.keys())

    def list_available_providers(
        self,
        user_keys: list[str] | None = None,
    ) -> list[str]:
        user_keys = user_keys or []

        environment_keys = {
            "openai": "OPENAI_API_KEY",
            "gemini": "GEMINI_API_KEY",
            "groq": "GROQ_API_KEY",
            "grok": "XAI_API_KEY",
        }

        return [
            provider
            for provider, env_name in environment_keys.items()
            if provider in user_keys or os.getenv(env_name)
        ]
