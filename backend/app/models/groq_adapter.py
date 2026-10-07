import asyncio
import json
import os
from typing import Any, Dict

from dotenv import load_dotenv
from groq import Groq

from app.models.model_adapter import ModelAdapter


load_dotenv()


class GroqAdapter(ModelAdapter):

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not configured."
            )

        self.client = Groq(
            api_key=self.api_key
        )

        self.model = "openai/gpt-oss-120b"

        self.max_retries = 3

    async def generate(
        self,
        prompt: str,
        context: Dict[str, Any] | None = None
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

                response = await asyncio.to_thread(
                    self.client.chat.completions.create,
                    model=self.model,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt_with_context
                        }
                    ],
                )

                content = response.choices[0].message.content

                if not content:
                    raise RuntimeError(
                        "Groq returned an empty response."
                    )

                return content

            except Exception as e:

                last_error = e

                error_text = str(e).upper()

                is_retryable = (
                    "429" in error_text
                    or "RATE LIMIT" in error_text
                    or "503" in error_text
                    or "UNAVAILABLE" in error_text
                    or "TIMEOUT" in error_text
                )

                if not is_retryable:
                    break

                if attempt < self.max_retries - 1:

                    wait_time = 2 ** attempt

                    await asyncio.sleep(wait_time)

        raise RuntimeError(
            f"Groq request failed after {self.max_retries} attempts: "
            f"{type(last_error).__name__}: {last_error}"
        ) from last_error