import os
from typing import Any, Dict

from google import genai

from app.models.model_adapter import ModelAdapter


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

    async def generate(
        self,
        prompt: str,
        context: Dict[str, Any] | None = None
    ) -> str:

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )

        if not response.text:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        return response.text