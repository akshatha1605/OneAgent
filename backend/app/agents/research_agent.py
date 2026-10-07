from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.models.model_adapter import ModelAdapter
from app.search.search_adapter import SearchAdapter


class ResearchAgent(BaseAgent):

    def __init__(
        self,
        model: ModelAdapter,
        search: SearchAdapter | None = None
    ):
        super().__init__(
            agent_id="research",
            name="Research Agent"
        )

        self.model = model
        self.search = search

    async def execute(
        self,
        task: str,
        context: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:

        try:

            research_context = ""

            if self.search:

                research_context = await self.search.search(
                    query=task,
                    context=context
                )

            prompt = f"""
You are OneAgent's specialized Research Agent.Your role is to handle research and information-analysis tasks.
Task:
{task}
External research results:
{research_context if research_context else "No external search results were provided."}
Instructions:
- Understand the research requirement.
- Use the provided research results when available.
- Organize the answer logically.
- Clearly distinguish established information from uncertainty.
- Compare information when requested.
- Do not invent sources or facts.
- Do not claim to have searched the web if no search results were provided.
- Keep the response concise and directly answer the user's task.
- Format the response using Markdown.
- Use a short heading when appropriate.
- Use bullet points or numbered lists for multiple points.
- Use tables only when they make a comparison clearer.
- Use code blocks when code is relevant.
- Avoid unnecessary introductions, repetition, and long explanations.
- Do not include a separate "Conclusion" section unless it adds useful information.
"""

            response = await self.model.generate(
                prompt=prompt,
                context=context
            )

            return self.success_response(
                task=task,
                result=response,
                metadata={
                    "task_type": "research",
                    "web_search_used": self.search is not None,
                    "execution_mode": "ai"
                }
            )

        except Exception as e:

            return self.error_response(
                task=task,
                error=str(e)
            )