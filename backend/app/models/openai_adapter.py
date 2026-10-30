
import asyncio
import json
import os
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

from app.models.model_adapter import ModelAdapter
from app.models.reliability import (
    is_retryable_provider_error,
    provider_timeout_seconds,
    retry_delay_seconds,
)


load_dotenv()


class OpenAIAdapter(ModelAdapter):
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")

        if not self.api_key:
            raise RuntimeError("OpenAI API key is not configured.")

        self.client = OpenAI(api_key=self.api_key)
        self.model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
        self.max_retries = 3

    async def generate(
        self,
        prompt: str,
        context: dict[str, Any] | None = None,
    ) -> str:
        prompt_with_context = prompt

        if context:
            prompt_with_context += (
                "\n\nContext from previous workflow steps:\n"
                + json.dumps(context, ensure_ascii=False, default=str)
            )

        last_error = None

        for attempt in range(self.max_retries):
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self.client.responses.create,
                        model=self.model,
                        input=prompt_with_context,
                    ),
                    timeout=provider_timeout_seconds("openai"),
                )

                content = response.output_text

                if not content:
                    raise RuntimeError("OpenAI returned an empty response.")

                return content

            except Exception as exc:
                last_error = exc
                retryable = is_retryable_provider_error(exc)

                if not retryable:
                    break

                if attempt < self.max_retries - 1:
                    await asyncio.sleep(retry_delay_seconds(attempt))

        raise RuntimeError(
            f"OpenAI request failed after {self.max_retries} attempts: "
            f"{type(last_error).__name__}: {last_error}"
        ) from last_error
