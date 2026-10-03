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
You are OneAgent's specialized Coding Agent.

Your role is to solve programming-related tasks.

Task:
{task}

Instructions:
- Understand the programming requirement.
- Choose an appropriate algorithm or approach.
- Produce clean and readable code.
- Explain the solution briefly.
- Mention important edge cases when relevant.
- Do not invent requirements that were not given.
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