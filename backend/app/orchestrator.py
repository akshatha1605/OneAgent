import asyncio
from typing import Any, Dict

from app.analyzer.task_analyzer import TaskAnalyzer
from app.agents.registry import (
    get_agent_implementation,
    find_agents_by_capability,
    get_all_agents,
)
from app.models.model_registry import ModelRegistry
from app.search.search_registry import SearchRegistry


class Orchestrator:
    """
    Central orchestration layer for OneAgent.

    Flow:
        User Task
            ↓
        Task Analyzer
            ↓
        Agent Selection
            ↓
        Model Selection
            ↓
        Agent Execution
            ↓
        Structured Result

    The current implementation focuses on reliable single-agent
    orchestration with model fallback.
    """

    ROUTING_CONFIDENCE_THRESHOLD = 0.50
    AGENT_EXECUTION_TIMEOUT_SECONDS = 60

    MODEL_PREFERENCES = {
        "coding": ["groq", "gemini"],
        "research": ["gemini", "groq"],
        "writing": ["groq", "gemini"],
        "document": ["gemini", "groq"],
    }

    def __init__(self):
        self.analyzer = TaskAnalyzer()
        self.model_registry = ModelRegistry()
        self.search_registry = SearchRegistry()

    # ---------------------------------------------------------
    # AGENT SELECTION
    # ---------------------------------------------------------

    def _select_agent(self, analysis):
        """
        Select an executable agent using:

        1. Recommended agent when semantic confidence is high.
        2. Capability-based fallback when confidence is low.
        3. Return unresolved if no suitable agent exists.
        """

        recommended_agent = analysis.recommended_agent
        confidence = analysis.confidence
        capabilities = analysis.capabilities or []

        # -----------------------------------------------------
        # Primary routing: recommended agent
        # -----------------------------------------------------

        if confidence >= self.ROUTING_CONFIDENCE_THRESHOLD and recommended_agent:

            agent_info = next(
                (
                    agent
                    for agent in get_all_agents()
                    if agent["id"] == recommended_agent
                ),
                None,
            )

            if (
                agent_info
                and agent_info["status"] == "available"
            ):
                return recommended_agent, "recommended"

        # -----------------------------------------------------
        # Fallback routing: capability matching
        # -----------------------------------------------------

        for capability in capabilities:

            matches = find_agents_by_capability(capability)

            for candidate in matches:

                candidate_id = candidate["id"]

                if candidate["status"] != "available":
                    continue

                return candidate_id, "capability_fallback"

        # -----------------------------------------------------
        # No suitable agent
        # -----------------------------------------------------

        return None, "unresolved"

    # ---------------------------------------------------------
    # MODEL SELECTION
    # ---------------------------------------------------------
    def _select_models(
        self,
        agent_id: str,
        complexity: str | None = None,
    ) -> list[str]:
        """
        Select providers using task-specific preferences.

        GPT is reserved for complex tasks and is used as
        a fallback after the regular providers.
        """

        available = self.model_registry.list_available_providers()

        preferences = self.MODEL_PREFERENCES.get(
            agent_id,
            ["groq", "gemini"],
        )

        selected = [
            provider
            for provider in preferences
            if provider in available
        ]

        # Use GPT only for tasks classified as complex.
        if complexity == "complex" and "openai" in available:
            if "openai" not in selected:
                selected.append("openai")

        return selected


    # ---------------------------------------------------------
    # SEARCH PROVIDER
    # ---------------------------------------------------------

    def _get_search_provider(self, agent_id: str):
        """
        Research tasks may use Tavily.

        Other agents do not require web search.
        """

        if agent_id != "research":
            return None

        try:
            return self.search_registry.get("tavily")
        except Exception:
            # Search is optional.
            # Research should still be able to execute
            # without Tavily if the provider is unavailable.
            return None

    # ---------------------------------------------------------
    # MAIN ORCHESTRATION
    # ---------------------------------------------------------

    async def process(
        self,
        task: str,
        context: Dict[str, Any] | None = None,
        forced_agent_id: str | None = None,
    ) -> Dict[str, Any]:

        # -----------------------------------------------------
        # Validate task
        # -----------------------------------------------------

        if not task or not task.strip():
            return {
                "status": "failed",
                "error": "Task cannot be empty.",
            }

        # -----------------------------------------------------
        # STEP 1 — Analyze task
        # -----------------------------------------------------

        analysis = await self.analyzer.analyze(task)

        analysis_data = analysis.model_dump()

        # -----------------------------------------------------
        # STEP 2 — Select agent
        # -----------------------------------------------------

        if forced_agent_id:
            forced_agent = next(
                (
                    agent
                    for agent in get_all_agents()
                    if agent["id"] == forced_agent_id
                    and agent["status"] == "available"
                ),
                None,
            )
            if forced_agent is None:
                return {
                    "status": "failed",
                    "task": task,
                    "analysis": analysis_data,
                    "selected_agent": None,
                    "routing": {
                        "method": "explicit",
                        "confidence": analysis.confidence,
                    },
                    "result": {
                        "status": "failed",
                        "error": (
                            f"Configured agent '{forced_agent_id}' "
                            "is not available."
                        ),
                    },
                }
            selected_agent_id = forced_agent_id
            routing_method = "explicit"
        else:
            selected_agent_id, routing_method = self._select_agent(
                analysis
            )

        # -----------------------------------------------------
        # No agent found
        # -----------------------------------------------------

        if selected_agent_id is None:

            return {
                "status": "failed",
                "task": task,

                "analysis": analysis_data,

                "selected_agent": None,

                "routing": {
                    "method": "unresolved",
                    "confidence": analysis.confidence,
                },

                "result": {
                    "status": "failed",
                    "error": (
                        "No suitable executable agent was "
                        "found for this task."
                    ),
                },
            }

        # -----------------------------------------------------
        # STEP 3 — Select model providers
        # -----------------------------------------------------

        model_candidates = self._select_models(
            agent_id=selected_agent_id,
            complexity=getattr(
                analysis,
                "complexity",
                None,
            ),
        )

        # -----------------------------------------------------
        # No model available
        # -----------------------------------------------------

        if not model_candidates:

            return {
                "status": "failed",
                "task": task,

                "analysis": analysis_data,

                "selected_agent": {
                    "id": selected_agent_id,
                },

                "routing": {
                    "method": routing_method,
                    "confidence": analysis.confidence,
                },

                "models": {
                    "available": self.model_registry.list_available_providers(),
                    "attempted": [],
                    "fallback_used": False,
                    "errors": {},
                },

                "search": {
                    "provider": None,
                    "used": False,
                },

                "result": {
                    "status": "failed",
                    "error": (
                        "No configured LLM provider is "
                        "available for this task."
                    ),
                },
            }

        # -----------------------------------------------------
        # STEP 4 — Configure search if required
        # -----------------------------------------------------

        search_provider = self._get_search_provider(
            selected_agent_id
        )

        search_name = (
            "tavily"
            if search_provider is not None
            else None
        )

        # -----------------------------------------------------
        # STEP 5 — Execute with model fallback
        # -----------------------------------------------------

        attempted_models = []
        model_errors = {}

        selected_model = None
        final_result = None
        final_agent = None

        fallback_used = False
        fallback_from = None

        for index, model_name in enumerate(
            model_candidates
        ):

            attempted_models.append(model_name)

            try:

                # ---------------------------------------------
                # Create model adapter
                # ---------------------------------------------

                model = self.model_registry.get(
                    model_name
                )

                # ---------------------------------------------
                # Create agent with injected dependencies
                # ---------------------------------------------

                agent = get_agent_implementation(
                    selected_agent_id,
                    model=model,
                    search=search_provider,
                )

                if agent is None:

                    model_errors[model_name] = (
                        f"No implementation found for "
                        f"agent '{selected_agent_id}'."
                    )

                    continue

                # ---------------------------------------------
                # Execute agent
                # ---------------------------------------------

                result = await asyncio.wait_for(
                    agent.execute(
                        task=task,
                        context=context,
                    ),
                    timeout=self.AGENT_EXECUTION_TIMEOUT_SECONDS,
                )

                # ---------------------------------------------
                # Successful execution
                # ---------------------------------------------

                if result.get("status") == "completed":

                    selected_model = model_name
                    final_result = result
                    final_agent = agent

                    if index > 0:
                        fallback_used = True
                        fallback_from = (
                            attempted_models[0]
                        )

                    break

                # ---------------------------------------------
                # Agent returned a structured failure
                # ---------------------------------------------

                model_errors[model_name] = result.get(
                    "error",
                    "Agent execution failed without "
                    "an error message.",
                )

            except Exception as e:

                # ---------------------------------------------
                # Capture actual provider error
                # ---------------------------------------------

                model_errors[model_name] = (
                    f"{type(e).__name__}: {e}"
                )

                continue

        # -----------------------------------------------------
        # STEP 6 — All models failed
        # -----------------------------------------------------

        if (
            final_result is None
            or final_agent is None
        ):

            return {
                "status": "failed",
                "task": task,

                "analysis": analysis_data,

                "selected_agent": {
                    "id": selected_agent_id,
                },

                "routing": {
                    "method": routing_method,
                    "confidence": analysis.confidence,
                },

                "models": {
                    "available": (
                        self.model_registry
                        .list_available_providers()
                    ),
                    "attempted": attempted_models,
                    "fallback_used": (
                        len(attempted_models) > 1
                    ),
                    "errors": model_errors,
                },

                "search": {
                    "provider": search_name,
                    "used": search_provider is not None,
                },

                "result": {
                    "status": "failed",
                    "error": (
                        "All available model providers "
                        "failed to execute the task."
                    ),
                },
            }

        # -----------------------------------------------------
        # STEP 7 — Successful final response
        # -----------------------------------------------------

        return {
            "status": "completed",
            "task": task,

            "analysis": analysis_data,

            "routing": {
                "method": routing_method,
                "confidence": analysis.confidence,
            },

            "selected_agent": {
                "id": final_agent.agent_id,
                "name": final_agent.name,
            },

            "model": {
                "selected": selected_model,
                "attempted": attempted_models,
                "fallback_used": fallback_used,
                "fallback_from": fallback_from,
            },

            "search": {
                "provider": search_name,
                "used": search_provider is not None,
            },

            "result": final_result,
        }