import asyncio
import os
from typing import Any, Dict

from dotenv import load_dotenv
from google import genai

from app.models.model_adapter import ModelAdapter


load_dotenv()


class GeminiAdapter(ModelAdapter):

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not configured."
            )

        self.client = genai.Client(
            api_key=self.api_key
        )

        self.model = "gemini-3.8-flash"

        self.max_retries = 3

    async def generate(
        self,
        prompt: str,
        context: Dict[str, Any] | None = None
    ) -> str:

        last_error = None

        for attempt in range(self.max_retries):

            try:

                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt
                )

                if not response.text:
                    raise RuntimeError(
                        "Gemini returned an empty response."
                    )

                return response.text

            except Exception as e:

                last_error = e

                error_text = str(e).upper()

                is_retryable = (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                    or "429" in error_text
                    or "RESOURCE_EXHAUSTED" in error_text
                )

                if not is_retryable:
                    break

                if attempt < self.max_retries - 1:

                    wait_time = 2 ** attempt

                    await asyncio.sleep(wait_time)

        raise RuntimeError(
            f"Gemini request failed after {self.max_retries} attempts: "
            f"{type(last_error).__name__}: {last_error}"
        ) from last_error