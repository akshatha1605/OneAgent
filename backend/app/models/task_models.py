from typing import List, Literal
from pydantic import BaseModel, Field


class TaskAnalysis(BaseModel):
    task_type: str = Field(
        description="Primary type of task."
    )

    capabilities: List[str] = Field(
        default_factory=list,
        description="Capabilities required to complete the task."
    )

    complexity: Literal["simple", "medium", "complex"] = Field(
        description="Estimated task complexity."
    )

    recommended_agent: str = Field(
        description="Recommended agent ID."
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence in the routing decision."
    )

    routing_method: Literal["local", "semantic", "llm"] = Field(
        description="Method used to determine the route."
    )