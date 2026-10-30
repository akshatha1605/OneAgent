
import os
import asyncio
from typing import Any

from openai import AsyncOpenAI

from app.models.model_adapter import ModelAdapter
from app.models.reliability import (
    is_retryable_provider_error,
    provider_timeout_seconds,
    retry_delay_seconds,
)


class GrokAdapter(ModelAdapter):
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("XAI_API_KEY")

        if not self.api_key:
            raise ValueError("Grok (xAI) API key is not configured.")

        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url="https://api.x.ai/v1",
        )
        self.model = os.getenv("GROK_MODEL", "grok-4")

    async def generate(
        self,
        prompt: str,
        context: dict[str, Any] | None = None,
    ) -> str:
        messages = []

        if context:
            messages.append({
                "role": "system",
                "content": f"Context:\n{context}",
            })

        messages.append({
            "role": "user",
            "content": prompt,
        })

        last_error = None
        for attempt in range(3):
            try:
                response = await asyncio.wait_for(
                    self.client.chat.completions.create(
                        model=self.model,
                        messages=messages,
                    ),
                    timeout=provider_timeout_seconds("grok"),
                )
                content = response.choices[0].message.content
                if not content:
                    raise RuntimeError("Grok returned an empty response.")
                return content
            except Exception as exc:
                last_error = exc
                if not is_retryable_provider_error(exc) or attempt == 2:
                    break
                await asyncio.sleep(retry_delay_seconds(attempt))

        raise RuntimeError(
            f"Grok request failed: {type(last_error).__name__}."
        ) from last_error
