
import asyncio
import os
import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.analyzer.task_analyzer import TaskAnalyzer
from app.agents.registry import (
    get_agent_implementation,
    find_agents_by_capability,
    get_all_agents,
)
from app.models.model_registry import ModelRegistry
from app.search.search_registry import SearchRegistry
from app.security.api_keys import get_user_api_key


class Orchestrator:
    """Central orchestration layer for OneAgent."""

    ROUTING_CONFIDENCE_THRESHOLD = 0.50
    AGENT_EXECUTION_TIMEOUT_SECONDS = 60

    MODEL_PREFERENCES = {
        "coding": ["groq", "gemini"],
        "research": ["gemini", "groq"],
        "writing": ["groq", "gemini"],
        "document": ["gemini", "groq"],
    }

    ENV_KEY_NAMES = {
        "openai": "OPENAI_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "groq": "GROQ_API_KEY",
        "grok": "XAI_API_KEY",
        "tavily": "TAVILY_API_KEY",
    }

    def __init__(self):
        self.analyzer = TaskAnalyzer()
        self.model_registry = ModelRegistry()
        self.search_registry = SearchRegistry()

    # ---------------------------------------------------------
    # USER CREDENTIALS
    # ---------------------------------------------------------

    def _get_user_keys(
        self,
        user_id: str | None,
        db: Session | None,
    ) -> dict[str, str]:
        """Retrieve and decrypt the current user's saved keys."""

        if not user_id or db is None:
            return {}

        keys = {}

        for provider in self.ENV_KEY_NAMES:
            key = get_user_api_key(
                db=db,
                user_id=user_id,
                provider=provider,
            )

            if key:
                keys[provider] = key

        return keys

    def _has_provider_key(
        self,
        provider: str,
        user_keys: dict[str, str],
    ) -> bool:
        return bool(
            user_keys.get(provider)
            or os.getenv(self.ENV_KEY_NAMES[provider])
        )

    # ---------------------------------------------------------
    # AGENT SELECTION
    # ---------------------------------------------------------

    def _select_agent(self, analysis):
        recommended_agent = analysis.recommended_agent
        confidence = analysis.confidence
        capabilities = analysis.capabilities or []

        if confidence >= self.ROUTING_CONFIDENCE_THRESHOLD and recommended_agent:
            agent_info = next(
                (
                    agent
                    for agent in get_all_agents()
                    if agent["id"] == recommended_agent
                ),
                None,
            )

            if agent_info and agent_info["status"] == "available":
                return recommended_agent, "recommended"

        for capability in capabilities:
            matches = find_agents_by_capability(capability)

            for candidate in matches:
                if candidate["status"] != "available":
                    continue

                return candidate["id"], "capability_fallback"

        return None, "unresolved"

    # ---------------------------------------------------------
    # MODEL SELECTION
    # ---------------------------------------------------------

    def _select_models(
        self,
        agent_id: str,
        complexity: str | None,
        user_keys: dict[str, str],
    ) -> list[str]:

        preferences = self.MODEL_PREFERENCES.get(
            agent_id,
            ["groq", "gemini"],
        )

        selected = [
            provider
            for provider in preferences
            if self._has_provider_key(provider, user_keys)
        ]

        if (
            complexity == "complex"
            and self._has_provider_key("openai", user_keys)
            and "openai" not in selected
        ):
            selected.append("openai")

        return selected

    # ---------------------------------------------------------
    # SEARCH PROVIDER
    # ---------------------------------------------------------

    def _get_search_provider(
        self,
        agent_id: str,
        user_keys: dict[str, str],
    ):
        if agent_id != "research":
            return None, "not_requested"

        if not self._has_provider_key("tavily", user_keys):
            return None, "missing_key"

        try:
            return (
                self.search_registry.get(
                    "tavily",
                    api_key=user_keys.get("tavily"),
                ),
                "ready",
            )
        except Exception:
            return None, "failed"

    # ---------------------------------------------------------
    # MAIN ORCHESTRATION
    # ---------------------------------------------------------

    async def process(
        self,
        task: str,
        context: dict[str, Any] | None = None,
        forced_agent_id: str | None = None,
        user_id: str | None = None,
        db: Session | None = None,
    ) -> dict[str, Any]:
        execution_id = str(uuid.uuid4())

        if not task or not task.strip():
            return {
                "execution_id": execution_id,
                "status": "failed",
                "error": "Task cannot be empty.",
            }

        # Retrieve credentials belonging only to this user.
        try:
            user_keys = self._get_user_keys(user_id, db)
        except Exception:
            return {
                "execution_id": execution_id,
                "status": "failed",
                "task": task,
                "error": (
                    "Could not access your saved API credentials. "
                    "Check the backend encryption configuration."
                ),
            }

        # STEP 1: Analyze task.
        analysis = await self.analyzer.analyze(task)
        analysis_data = analysis.model_dump()

        # STEP 2: Select agent.
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
                    "execution_id": execution_id,
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

        if selected_agent_id is None:
            return {
                "execution_id": execution_id,
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
                        "No suitable executable agent was found "
                        "for this task."
                    ),
                },
            }

        # STEP 3: Select configured providers.
        model_candidates = self._select_models(
            agent_id=selected_agent_id,
            complexity=getattr(analysis, "complexity", None),
            user_keys=user_keys,
        )

        if not model_candidates:
            return {
                "execution_id": execution_id,
                "status": "failed",
                "task": task,
                "analysis": analysis_data,
                "selected_agent": {"id": selected_agent_id},
                "routing": {
                    "method": routing_method,
                    "confidence": analysis.confidence,
                },
                "models": {
                    "available": [
                        provider
                        for provider in self.model_registry.list_providers()
                        if self._has_provider_key(provider, user_keys)
                    ],
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
                        "No configured LLM provider is available "
                        "for this task. Add a provider API key in Settings."
                    ),
                },
            }

        # STEP 4: Configure optional search.
        search_provider, search_status = self._get_search_provider(
            selected_agent_id,
            user_keys,
        )

        search_name = "tavily" if search_provider else None

        # STEP 5: Execute with model fallback.
        attempted_models = []
        model_errors = {}

        selected_model = None
        final_result = None
        final_agent = None

        fallback_used = False
        fallback_from = None

        for index, model_name in enumerate(model_candidates):
            attempted_models.append(model_name)

            try:
                # Personal key takes precedence over environment key.
                model = self.model_registry.get(
                    model_name,
                    api_key=user_keys.get(model_name),
                )

                agent = get_agent_implementation(
                    selected_agent_id,
                    model=model,
                    search=search_provider,
                    search_status=search_status,
                )

                if agent is None:
                    model_errors[model_name] = (
                        f"No implementation found for agent "
                        f"'{selected_agent_id}'."
                    )
                    continue

                result = await asyncio.wait_for(
                    agent.execute(
                        task=task,
                        context=context,
                    ),
                    timeout=self.AGENT_EXECUTION_TIMEOUT_SECONDS,
                )

                if result.get("status") == "completed":
                    selected_model = model_name
                    final_result = result
                    final_agent = agent

                    if index > 0:
                        fallback_used = True
                        fallback_from = attempted_models[0]

                    break

                model_errors[model_name] = result.get(
                    "error",
                    "Agent execution failed without an error message.",
                )

            except Exception as exc:
                # Do not expose credentials in error responses.
                model_errors[model_name] = (
                    f"{type(exc).__name__}: Provider execution failed."
                )

        # STEP 6: All providers failed.
        if final_result is None or final_agent is None:
            return {
                "execution_id": execution_id,
                "status": "failed",
                "task": task,
                "analysis": analysis_data,
                "selected_agent": {"id": selected_agent_id},
                "routing": {
                    "method": routing_method,
                    "confidence": analysis.confidence,
                },
                "models": {
                    "available": model_candidates,
                    "attempted": attempted_models,
                    "fallback_used": len(attempted_models) > 1,
                    "errors": model_errors,
                },
                "search": {
                    "provider": search_name or "tavily"
                    if selected_agent_id == "research"
                    else None,
                    "status": "not_run" if search_status == "ready" else search_status,
                    "used": False,
                    "results_count": 0,
                    "sources": [],
                },
                "result": {
                    "status": "failed",
                    "error": (
                        "All available model providers failed "
                        "to execute the task."
                    ),
                },
            }

        # STEP 7: Successful response.
        return {
            "execution_id": execution_id,
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
            "search": (
                (final_result.get("metadata") or {}).get("search")
                or {
                    "provider": search_name,
                    "status": search_status,
                    "used": False,
                    "results_count": 0,
                    "sources": [],
                    "error": None,
                }
            ),
            "result": final_result,
        }
