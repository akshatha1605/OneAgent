# ============================================================
# ONEAGENT - AGENT REGISTRY
# ============================================================

AGENT_REGISTRY = {

    "gemini": {
        "id": "gemini",
        "name": "Gemini",
        "type": "General AI",
        "description": "General-purpose AI agent for everyday tasks.",
        "capabilities": [
            "general_question",
            "reasoning",
            "summarization",
            "conversation"
        ],
        "plan": "Free",
        "status": "available",
    },

    "research": {
        "id": "research",
        "name": "Research Agent",
        "type": "Web Research",
        "description": "Agent specialized in research and information gathering.",
        "capabilities": [
            "research",
            "information_search",
            "fact_finding",
            "comparison",
            "summarization"
        ],
        "plan": "Free",
        "status": "available",
    },

    "coding": {
        "id": "coding",
        "name": "Code Agent",
        "type": "Programming",
        "description": "Agent specialized in programming and software development.",
        "capabilities": [
            "programming",
            "code_generation",
            "debugging",
            "code_explanation",
            "algorithm_design"
        ],
        "plan": "Free",
        "status": "available",
    },

    "writing": {
        "id": "writing",
        "name": "Writing Agent",
        "type": "Content Creation",
        "description": "Agent specialized in creating and improving written content.",
        "capabilities": [
            "writing",
            "rewriting",
            "content_generation",
            "editing",
            "summarization"
        ],
        "plan": "Free",
        "status": "available",
    },

    "document": {
        "id": "document",
        "name": "Document Agent",
        "type": "Document Preparation",
        "description": "Agent specialized in structured document preparation.",
        "capabilities": [
            "document_generation",
            "report_generation",
            "documentation",
            "formatting"
        ],
        "plan": "Free",
        "status": "available",
    },

    "gpt-advanced": {
        "id": "gpt-advanced",
        "name": "Advanced GPT",
        "type": "Advanced Reasoning",
        "description": "Advanced reasoning agent available for Pro users.",
        "capabilities": [
            "advanced_reasoning",
            "complex_analysis",
            "planning"
        ],
        "plan": "Pro",
        "status": "premium",
    },
}


def get_all_agents():
    """Return all registered agents."""
    return list(AGENT_REGISTRY.values())


def get_agent(agent_id: str):
    """Return a specific agent by ID."""
    return AGENT_REGISTRY.get(agent_id)


def find_agents_by_capability(capability: str):
    """Find agents that support a given capability."""
    return [
        agent
        for agent in AGENT_REGISTRY.values()
        if capability in agent["capabilities"]
    ]