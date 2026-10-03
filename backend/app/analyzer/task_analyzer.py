from typing import Dict

from sentence_transformers import SentenceTransformer, util

from app.models.task_models import TaskAnalysis


class TaskAnalyzer:
    """
    Semantic task analyzer for OneAgent.

    Uses sentence embeddings to determine which registered
    agent is the best semantic match for the user's task.

    The routing confidence is based on the relative separation
    between the best and second-best agent matches rather than
    treating raw cosine similarity as probability.
    """

    def __init__(self):

        self.model = SentenceTransformer(
            "all-MiniLM-L6-v2"
        )

        self.agent_descriptions: Dict[str, str] = {

            "coding": (
                "Programming and software development tasks. "
                "Writing Python, Java, C++, JavaScript or other programs. "
                "Debugging code, fixing errors, implementing algorithms, "
                "designing functions, APIs and solving programming problems."
            ),

            "research": (
                "Research and information gathering tasks. "
                "Finding facts, investigating topics, studying subjects, "
                "comparing information, collecting evidence and "
                "summarizing research findings."
            ),

            "writing": (
                "Writing and content creation tasks. "
                "Writing essays, emails, articles, captions and paragraphs. "
                "Rewriting, editing, paraphrasing and improving written content."
            ),

            "document": (
                "Structured document preparation tasks. "
                "Creating reports, documentation, formatted documents, "
                "project documentation and structured written documents."
            ),
        }

        self.agent_names = list(
            self.agent_descriptions.keys()
        )

        self.agent_embeddings = self.model.encode(
            list(self.agent_descriptions.values()),
            convert_to_tensor=True
        )

    async def analyze(self, task: str) -> TaskAnalysis:

        if not task or not task.strip():
            raise ValueError("Task cannot be empty.")

        # ---------------------------------------------------------
        # 1. Encode user task
        # ---------------------------------------------------------

        task_embedding = self.model.encode(
            task,
            convert_to_tensor=True
        )

        # ---------------------------------------------------------
        # 2. Calculate similarity against every agent
        # ---------------------------------------------------------

        similarities = util.cos_sim(
            task_embedding,
            self.agent_embeddings
        )[0]

        # Sort agents by similarity.
        ranked_indices = similarities.argsort(
            descending=True
        )

        best_index = int(
            ranked_indices[0].item()
        )

        second_index = int(
            ranked_indices[1].item()
        )

        best_agent = self.agent_names[best_index]

        best_similarity = float(
            similarities[best_index].item()
        )

        second_similarity = float(
            similarities[second_index].item()
        )

        # ---------------------------------------------------------
        # 3. Calculate routing confidence
        # ---------------------------------------------------------
        #
        # Raw cosine similarity is NOT treated as probability.
        #
        # Instead, confidence depends on how clearly the best
        # agent is separated from the next-best agent.
        #

        margin = best_similarity - second_similarity

        # Convert the margin into a practical routing confidence.
        #
        # A margin of around 0.20 or greater indicates a strong
        # semantic separation for this small four-agent registry.
        #
        # The value is capped to [0, 1].

        confidence = min(
            1.0,
            max(
                0.0,
                margin / 0.20
            )
        )

        # ---------------------------------------------------------
        # 4. Determine complexity
        # ---------------------------------------------------------

        word_count = len(task.split())

        if word_count > 40:
            complexity = "complex"
        elif word_count > 15:
            complexity = "medium"
        else:
            complexity = "simple"

        # ---------------------------------------------------------
        # 5. Map agent to task type
        # ---------------------------------------------------------

        task_type_map = {
            "coding": "programming",
            "research": "research",
            "writing": "writing",
            "document": "document_generation",
        }

        capability_map = {
            "coding": [
                "programming",
                "code_generation",
            ],

            "research": [
                "research",
                "information_search",
            ],

            "writing": [
                "writing",
                "content_generation",
            ],

            "document": [
                "document_generation",
                "documentation",
            ],
        }

        # ---------------------------------------------------------
        # 6. Return structured analysis
        # ---------------------------------------------------------

        return TaskAnalysis(
            task_type=task_type_map[best_agent],
            capabilities=capability_map[best_agent],
            complexity=complexity,
            recommended_agent=best_agent,
            confidence=confidence,
            routing_method="semantic",
        )