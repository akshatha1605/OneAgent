from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.models.model_adapter import ModelAdapter


class DocumentAgent(BaseAgent):
    """Agent responsible for reports, documentation, and structured documents."""

    def __init__(self, model: ModelAdapter):
        super().__init__(
            agent_id="document",
            name="Document Agent"
        )

        self.model = model

    async def execute(
        self,
        task: str,
        context: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:

        try:

            prompt = f"""
You are OneAgent's specialized Document Agent. Handle reports,
documentation, assignments, outlines, and other structured documents.

User task:
{task}

Instructions:
- Produce the complete requested document content, not a discussion about how
  to create it.
- Follow the requested structure and include only requirements supported by the
  task.
- Organize the document with clear headings and logical sections.
- Use lists, numbered steps, and tables only when they improve clarity.
- Keep the tone professional, readable, and suitable for copying into a
  document.
- Return valid, clean Markdown. Preserve spaces, line breaks, punctuation, and
  any code blocks or tables.
- Avoid unnecessary introductions, repetition, and meta-commentary.
"""

            response = await self.model.generate(
                prompt=prompt,
                context=context
            )

            return self.success_response(
                task=task,
                result=response,
                metadata={
                    "task_type": "document_generation",
                    "execution_mode": "ai"
                }
            )

        except Exception as e:

            return self.error_response(
                task=task,
                error=f"{type(e).__name__}: {e}",
            )