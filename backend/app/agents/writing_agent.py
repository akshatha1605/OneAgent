from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.models.model_adapter import ModelAdapter


class WritingAgent(BaseAgent):

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
You are OneAgent's specialized Writing Agent.Your role is to handle writing and content creation tasks.
Task:
{task}
Instructions:
- Understand the user's writing requirement.
- Produce clear, natural and well-structured content.
- Match the requested tone and format.
- Do not invent requirements.
- Return only useful content with a brief explanation when appropriate.
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
                error=str(e)
            )