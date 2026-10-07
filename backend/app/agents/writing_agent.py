from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.models.model_adapter import ModelAdapter


class WritingAgent(BaseAgent):
    """Agent responsible for writing, editing, and content creation tasks."""

    def __init__(self, model: ModelAdapter):
        super().__init__(
            agent_id="writing",
            name="Writing Agent"
        )

        self.model = model

    async def execute(
        self,
        task: str,
        context: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:

        try:

            prompt = f"""
You are OneAgent's specialized Writing Agent. Handle emails, essays,
rewriting, paraphrasing, editing, captions, and other content-creation tasks.

User task:
{task}

Instructions:
- Produce the requested writing directly.
- Preserve the user's requested tone, audience, purpose, and format.
- Do not invent requirements or add explanations around the writing unless the
  user asks for them.
- Return clean, natural writing. Use valid Markdown only when formatting is
  useful for the requested content.
- Preserve spaces, line breaks, punctuation, and paragraph structure.
- Avoid unnecessary introductions, repetition, headings, or commentary.
"""

            response = await self.model.generate(
                prompt=prompt,
                context=context
            )

            return self.success_response(
                task=task,
                result=response,
                metadata={
                    "task_type": "writing",
                    "execution_mode": "ai"
                }
            )

        except Exception as e:

            return self.error_response(
                task=task,
                error=f"{type(e).__name__}: {e}",
            )