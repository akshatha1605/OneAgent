
import asyncio
import json
import os
from typing import Any

from google import genai

from app.models.model_adapter import ModelAdapter
from app.models.reliability import (
    is_retryable_provider_error,
    provider_timeout_seconds,
    retry_delay_seconds,
)


class GeminiAdapter(ModelAdapter):
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

        if not self.api_key:
            raise RuntimeError("Gemini API key is not configured.")

        self.client = genai.Client(api_key=self.api_key)
        self.model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        self.max_retries = 3

    async def generate(
        self,
        prompt: str,
        context: dict[str, Any] | None = None,
    ) -> str:
        last_error = None
        prompt_with_context = prompt

        if context:
            prompt_with_context += (
                "\n\nContext from previous workflow steps:\n"
                + json.dumps(context, ensure_ascii=False, default=str)
            )

        for attempt in range(self.max_retries):
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self.client.models.generate_content,
                        model=self.model,
                        contents=prompt_with_context,
                        config=genai.types.GenerateContentConfig(
                            automatic_function_calling=(
                                genai.types.AutomaticFunctionCallingConfig(
                                    disable=True
                                )
                            )
                        ),
                    ),
                    timeout=provider_timeout_seconds("gemini"),
                )

                if not response.text:
                    raise RuntimeError("Gemini returned an empty response.")

                return response.text

            except Exception as exc:
                last_error = exc
                retryable = is_retryable_provider_error(exc)

                if not retryable:
                    break

                if attempt < self.max_retries - 1:
                    await asyncio.sleep(retry_delay_seconds(attempt))

        raise RuntimeError(
            f"Gemini request failed after {self.max_retries} attempts: "
            f"{type(last_error).__name__}: {last_error}"
        ) from last_error
