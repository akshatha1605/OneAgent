import asyncio
from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.models.model_adapter import ModelAdapter
from app.search.search_adapter import SearchAdapter


def _normalize_prose_spacing(text: str) -> str:
    """Use ordinary spaces in prose without changing fenced code blocks."""

    normalized_lines = []
    in_code_block = False

    for line in text.splitlines(keepends=True):
        stripped = line.lstrip()
        is_fence = stripped.startswith(("```", "~~~"))

        if is_fence:
            in_code_block = not in_code_block
            normalized_lines.append(line)
            continue

        if not in_code_block:
            line = line.replace("\u00a0", " ").replace("\u202f", " ")

        normalized_lines.append(line)

    return "".join(normalized_lines)


class ResearchAgent(BaseAgent):
    """
    Agent responsible for research, explanation, and
    information-analysis tasks.
    """

    def __init__(
        self,
        model: ModelAdapter,
        search: SearchAdapter | None = None,
    ):
        super().__init__(
            agent_id="research",
            name="Research Agent",
        )

        self.model = model
        self.search = search

    async def execute(
        self,
        task: str,
        context: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:

        try:

            # -----------------------------------------------------
            # 1. Optional web research
            # -----------------------------------------------------

            research_context = ""
            search_error = None

            if self.search:
                try:
                    research_context = await asyncio.wait_for(
                        self.search.search(
                            query=task,
                            context=context,
                        ),
                        timeout=15,
                    )
                except Exception as exc:
                    search_error = f"{type(exc).__name__}: {exc}"

            # -----------------------------------------------------
            # 2. Build research prompt
            # -----------------------------------------------------

            prompt = f"""
You are OneAgent's specialized Research Agent. Answer explanations,
factual questions, comparisons, research, and learning requests.

User task:
{task}

Research results supplied by Tavily:
{research_context if research_context else "No search results were received. Do not claim that web research was performed."}

Instructions:
- Answer directly in simple language when the task is simple.
- Use the supplied research results when relevant. Do not invent facts,
  sources, citations, statistics, or quotations.
- Preserve technical terms exactly and do not concatenate words.
- Use ordinary spaces between words (U+0020), not non-breaking or narrow
  non-breaking spaces.
- Return only the final answer, with no meta-commentary or unnecessary
  introduction.
- Return valid Markdown: put a space after heading markers and list markers,
  close bold and italic markers correctly, and use fenced code blocks for code.
- Use tables only when they improve a comparison or clarify information.
- Preserve normal spaces, punctuation, paragraph breaks, and Markdown structure.
- Before responding, check that headings, lists, emphasis, links, tables, and
  code fences are syntactically complete and readable.
"""

            # -----------------------------------------------------
            # 3. Generate response
            # -----------------------------------------------------

            response = await self.model.generate(
                prompt=prompt,
                context=context,
            )
            response = _normalize_prose_spacing(response)

            # -----------------------------------------------------
            # 4. Return successful result
            # -----------------------------------------------------

            return self.success_response(
                task=task,
                result=response,
                metadata={
                    "task_type": "research",
                    "web_search_used": bool(research_context),
                    "execution_mode": "ai",
                    **(
                        {"search_error": search_error}
                        if search_error
                        else {}
                    ),
                },
            )

        except Exception as e:

            return self.error_response(
                task=task,
                error=f"{type(e).__name__}: {e}",
            )