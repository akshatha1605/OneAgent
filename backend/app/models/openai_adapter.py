import asyncio
import os
from typing import Any, Dict

from dotenv import load_dotenv
from openai import OpenAI

from app.models.model_adapter import ModelAdapter


load_dotenv()


class OpenAIAdapter(ModelAdapter):
    """
    LLM adapter using OpenAI.
    """

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not configured."
            )

        self.client = OpenAI(
            api_key=self.api_key
        )

        self.model = "gpt-5-mini"
        self.max_retries = 3

    async def generate(
        self,
        prompt: str,
        context: Dict[str, Any] | None = None
    ) -> str:

        last_error = None

        for attempt in range(self.max_retries):

            try:

                response = self.client.responses.create(
                    model=self.model,
                    input=prompt
                )

                content = response.output_text

                if not content:
                    raise RuntimeError(
                        "OpenAI returned an empty response."
                    )

                return content

            except Exception as e:

                last_error = e

                error_text = str(e).upper()

                is_retryable = (
                    "429" in error_text
                    or "500" in error_text
                    or "502" in error_text
                    or "503" in error_text
                    or "504" in error_text
                    or "TIMEOUT" in error_text
                )

                if not is_retryable:
                    break

                if attempt < self.max_retries - 1:
                    wait_time = 2 ** attempt
                    await asyncio.sleep(wait_time)

        raise RuntimeError(
            f"OpenAI request failed after "
            f"{self.max_retries} attempts: "
            f"{type(last_error).__name__}: {last_error}"
        ) from last_error