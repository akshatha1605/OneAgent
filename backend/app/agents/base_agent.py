from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseAgent(ABC):
    """
    Common contract for all OneAgent specialized agents.
    """

    def __init__(self, agent_id: str, name: str):
        self.agent_id = agent_id
        self.name = name

    @abstractmethod
    async def execute(
        self,
        task: str,
        context: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:
        """
        Execute a task and return a standardized result.
        """
        pass

    def success_response(
        self,
        task: str,
        result: Any,
        metadata: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:

        return {
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "status": "completed",
            "task": task,
            "result": result,
            "metadata": metadata or {},
        }

    def error_response(
        self,
        task: str,
        error: str
    ) -> Dict[str, Any]:

        return {
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "status": "failed",
            "task": task,
            "result": None,
            "metadata": {},
            "error": error,
        }