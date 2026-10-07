from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.models.model_adapter import ModelAdapter


class CodingAgent(BaseAgent):
    """
    Agent responsible for programming and software-development tasks.
    """

    def __init__(self, model: ModelAdapter):
        super().__init__(
            agent_id="coding",
            name="Coding Agent",
        )

        self.model = model

    async def execute(
        self,
        task: str,
        context: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:

        try:

            prompt = f"""
You are OneAgent's specialized Coding Agent. Handle programming and
software-development tasks, including code generation, debugging,
refactoring, algorithms, and code explanations.

User task:
{task}

Instructions:
- Answer the specific request directly and do not invent requirements.
- Provide correct, clean, readable code when code is requested.
- Put every code sample in a fenced Markdown code block with the
  appropriate language identifier.
- Explain the solution briefly and mention relevant edge cases or errors.
- If the user asks only for a conceptual explanation, do not generate
  unrelated code; include a small example only when it improves understanding.
- Use headings, lists, and other Markdown formatting when they improve clarity.
- Return valid, clean Markdown only. Preserve code, punctuation, spacing, and
  line breaks.
- Do not add unnecessary introductions, repetition, or a separate conclusion.
"""

            response = await self.model.generate(
                prompt=prompt,
                context=context,
            )

            return self.success_response(
                task=task,
                result=response,
                metadata={
                    "task_type": "programming",
                    "execution_mode": "ai",
                },
            )

        except Exception as e:

            return self.error_response(
                task=task,
                error=f"{type(e).__name__}: {e}",
            )