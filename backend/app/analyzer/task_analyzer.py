# ============================================================
# ONEAGENT - TASK ANALYZER
# ============================================================

from typing import Dict, Any


class TaskAnalyzer:
    """
    Analyzes a user task and identifies the capabilities
    required to complete it.
    """

    def analyze(self, task: str) -> Dict[str, Any]:

        text = task.lower().strip()

        capabilities = []

        # ----------------------------------------------------
        # Programming
        # ----------------------------------------------------

        programming_keywords = [
            "code",
            "coding",
            "program",
            "programming",
            "python",
            "java",
            "javascript",
            "debug",
            "bug",
            "algorithm",
            "function",
            "api",
            "implement",
        ]

        if any(word in text for word in programming_keywords):
            capabilities.append("programming")

        # ----------------------------------------------------
        # Research
        # ----------------------------------------------------

        research_keywords = [
            "research",
            "find information",
            "search",
            "latest",
            "investigate",
            "study",
            "compare",
            "comparison",
            "advantages",
            "disadvantages",
        ]

        if any(word in text for word in research_keywords):
            capabilities.append("research")

        # ----------------------------------------------------
        # Writing
        # ----------------------------------------------------

        writing_keywords = [
            "write",
            "rewrite",
            "rephrase",
            "edit",
            "improve",
            "essay",
            "paragraph",
            "content",
            "caption",
            "email",
        ]

        if any(word in text for word in writing_keywords):
            capabilities.append("writing")

        # ----------------------------------------------------
        # Document generation
        # ----------------------------------------------------

        document_keywords = [
            "report",
            "document",
            "documentation",
            "prepare a report",
            "generate a report",
            "pdf",
        ]

        if any(word in text for word in document_keywords):
            capabilities.append("document_generation")

        # ----------------------------------------------------
        # General task
        # ----------------------------------------------------

        if not capabilities:
            capabilities.append("general_question")

        # ----------------------------------------------------
        # Determine task complexity
        # ----------------------------------------------------

        requires_multiple_agents = len(capabilities) > 1

        if requires_multiple_agents:
            task_type = "complex"
        elif capabilities[0] == "general_question":
            task_type = "general"
        else:
            task_type = "simple"
        if (
            any(word in text for word in writing_keywords)
            and "programming" not in capabilities
        ):
            capabilities.append("writing")

        return {
            "task": task,
            "task_type": task_type,
            "required_capabilities": capabilities,
            "requires_multiple_agents": requires_multiple_agents,
        }