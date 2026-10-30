from typing import Dict, Type

from app.agents.base_agent import BaseAgent
from app.agents.coding_agent import CodingAgent
from app.agents.research_agent import ResearchAgent
from app.agents.writing_agent import WritingAgent
from app.agents.document_agent import DocumentAgent

from app.models.model_adapter import ModelAdapter
from app.search.search_adapter import SearchAdapter


AGENT_REGISTRY = {

    "research": {
        "id": "research",
        "name": "Research Agent",
        "type": "Web Research",
        "description": (
            "Agent specialized in research, information gathering, "
            "research papers, articles, and current information."
        ),
        "capabilities": [
            "research",
            "information_search",
            "web_search",
            "paper_search",
            "article_search",
            "fact_finding",
            "comparison",
            "summarization",
        ],
        "tools": [
            "search",
        ],
        "status": "available",
    },

    "coding": {
        "id": "coding",
        "name": "Code Agent",
        "type": "Programming",
        "description": (
            "Agent specialized in programming and software development."
        ),
        "capabilities": [
            "programming",
            "code_generation",
            "debugging",
            "code_explanation",
            "algorithm_design",
        ],
        "tools": [],
        "status": "available",
    },

    "writing": {
        "id": "writing",
        "name": "Writing Agent",
        "type": "Content Creation",
        "description": (
            "Agent specialized in creating and improving written content."
        ),
        "capabilities": [
            "writing",
            "rewriting",
            "content_generation",
            "editing",
            "summarization",
        ],
        "tools": [],
        "status": "available",
    },

    "document": {
        "id": "document",
        "name": "Document Agent",
        "type": "Document Preparation",
        "description": (
            "Agent specialized in structured document preparation."
        ),
        "capabilities": [
            "document_generation",
            "report_generation",
            "documentation",
            "formatting",
        ],
        "tools": [],
        "status": "available",
    },
}


AGENT_IMPLEMENTATIONS: Dict[str, Type[BaseAgent]] = {
    "coding": CodingAgent,
    "research": ResearchAgent,
    "writing": WritingAgent,
    "document": DocumentAgent,
}


def get_all_agents():
    """Return metadata for all registered agents."""
    return list(AGENT_REGISTRY.values())


def get_agent(agent_id: str):
    """Return metadata for a specific agent."""
    return AGENT_REGISTRY.get(agent_id)


def find_agents_by_capability(capability: str):
    """Return all registered agents supporting a capability."""
    capability = capability.lower().strip()

    return [
        agent
        for agent in AGENT_REGISTRY.values()
        if capability in agent["capabilities"]
        and agent["status"] == "available"
    ]


def get_agent_implementation(
    agent_id: str,
    model: ModelAdapter,
    search: SearchAdapter | None = None,
    search_status: str = "not_requested",
):
    """
    Create an executable agent with its required dependencies.
    """

    agent_class = AGENT_IMPLEMENTATIONS.get(agent_id)

    if not agent_class:
        return None

    if agent_id == "research":
        return agent_class(
            model=model,
            search=search,
            search_status=search_status,
        )

    return agent_class(
        model=model,
    )