import asyncio
import json
import os
from typing import Any, Dict

from dotenv import load_dotenv
from openai import OpenAI

from app.models.model_adapter import ModelAdapter

load_dotenv()


class GrokAdapter(ModelAdapter):
    def __init__(self):
        self.api_key = os.getenv("XAI_API_KEY")

        if not self.api_key:
            raise RuntimeError("XAI_API_KEY is not configured.")

        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.x.ai/v1",
            timeout=120.0,
            max_retries=0,
        )

        self.model = os.getenv("XAI_MODEL", "grok-4.7")
        self.max_retries = 3

    async def generate(
        self,
        prompt: str,
        context: Dict[str, Any] | None = None,
    ) -> str:
        prompt_with_context = prompt

        if context:
            prompt_with_context += (
                "\n\nContext from previous workflow steps:\n"
                + json.dumps(
                    context,
                    ensure_ascii=False,
                    default=str,
                )
            )

        last_error = None

        for attempt in range(self.max_retries):
            try:
                response = await asyncio.to_thread(
                    self.client.chat.completions.create,
                    model=self.model,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt_with_context,
                        }
                    ],
                )

                content = response.choices[0].message.content

                if not content or not content.strip():
                    raise RuntimeError("Grok returned an empty response.")

                return content

            except Exception as exc:
                last_error = exc
                error_text = str(exc).upper()

                retryable = any(
                    marker in error_text
                    for marker in (
                        "429",
                        "RATE LIMIT",
                        "500",
                        "502",
                        "503",
                        "504",
                        "TIMEOUT",
                        "UNAVAILABLE",
                    )
                )

                if not retryable or attempt == self.max_retries - 1:
                    break

                await asyncio.sleep(2 ** attempt)

        raise RuntimeError(
            f"Grok request failed: "
            f"{type(last_error).__name__}: {last_error}"
        ) from last_error
