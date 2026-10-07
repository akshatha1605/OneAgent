from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.models.model_adapter import ModelAdapter


class DocumentAgent(BaseAgent):

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
You are OneAgent's specialized Document Agent.Your role is to prepare structured documents and reports.
Task:
{task}
Instructions:
- Understand the requested document structure.
- Organize the content using appropriate headings.
- Keep the document professional and readable.
- Include sections requested by the user.
- Do not invent requirements.
- Keep the response concise and directly focused on the task.
- Return the response using Markdown when appropriate.
- Use headings, bullet points, or numbered lists when they improve readability.
- Avoid unnecessary introductions and repetition.
- Return the complete structured document content.
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
                error=str(e)
            )