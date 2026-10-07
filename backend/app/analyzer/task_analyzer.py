import importlib
import math
import re
from typing import Dict


try:
    _sentence_transformers = importlib.import_module("sentence_transformers")
    SentenceTransformer = _sentence_transformers.SentenceTransformer
    util = _sentence_transformers.util
except ImportError:
    class _FallbackScore:
        def __init__(self, value: float):
            self._value = value

        def item(self) -> float:
            return self._value

    class _FallbackSentenceTransformer:
        """Dependency-free fallback used when sentence-transformers is unavailable."""

        def __init__(self, *_args, **_kwargs):
            pass

        @staticmethod
        def encode(texts, convert_to_tensor=True):
            del convert_to_tensor
            is_single = isinstance(texts, str)
            if is_single:
                texts = [texts]

            vectors = []
            for text in texts:
                vector = {}
                for word in re.findall(r"[a-z0-9+#.]+", text.lower()):
                    vector[word] = vector.get(word, 0.0) + 1.0
                vectors.append(vector)
            return vectors[0] if is_single else vectors

    class _FallbackUtil:
        @staticmethod
        def cos_sim(left, right):
            right_vectors = [right] if isinstance(right, dict) else right
            left_norm = math.sqrt(sum(value * value for value in left.values()))
            scores = []
            for right_vector in right_vectors:
                numerator = sum(
                    left[key] * right_vector[key]
                    for key in left.keys() & right_vector.keys()
                )
                right_norm = math.sqrt(
                    sum(value * value for value in right_vector.values())
                )
                denominator = left_norm * right_norm
                scores.append(
                    _FallbackScore(numerator / denominator if denominator else 0.0)
                )
            return [scores]

    SentenceTransformer = _FallbackSentenceTransformer
    util = _FallbackUtil()

from app.models.task_models import TaskAnalysis


class TaskAnalyzer:
    """
    Semantic + intent-aware task analyzer for OneAgent.

    Uses sentence embeddings as the primary routing mechanism,
    with lightweight intent signals to improve classification for
    common user requests such as explanations, research questions,
    writing requests, coding tasks, and document generation.
    """

    def __init__(self):

        self.model = SentenceTransformer(
            "all-MiniLM-L6-v2"
        )

        self.agent_descriptions: Dict[str, str] = {

            "coding": (
                "Programming and software development tasks. "
                "Writing code in Python, Java, C++, JavaScript or other languages. "
                "Debugging code, fixing programming errors, implementing algorithms, "
                "creating functions, APIs, software components and solving coding problems."
            ),

            "research": (
                "General knowledge, research, learning and information tasks. "
                "Explaining concepts, answering factual questions, studying subjects, "
                "understanding technical concepts, investigating topics, finding facts, "
                "comparing information and summarizing research findings."
            ),

            "writing": (
                "Writing and content creation tasks. "
                "Writing essays, emails, articles, captions, paragraphs and creative content. "
                "Rewriting, editing, paraphrasing, proofreading and improving existing text."
            ),

            "document": (
                "Structured document preparation tasks. "
                "Creating reports, documentation, project reports, formatted documents, "
                "assignments and other structured written documents."
            ),
        }

        self.agent_names = list(
            self.agent_descriptions.keys()
        )

        self.agent_embeddings = self.model.encode(
            list(self.agent_descriptions.values()),
            convert_to_tensor=True
        )

        # ---------------------------------------------------------
        # Intent signals
        # ---------------------------------------------------------

        self.coding_keywords = {
            "code",
            "coding",
            "program",
            "programming",
            "implement",
            "implementation",
            "debug",
            "debugging",
            "bug",
            "error",
            "function",
            "class",
            "api",
            "algorithm",
            "python",
            "java",
            "javascript",
            "typescript",
            "c++",
            "sql",
            "react",
            "nextjs",
            "next.js",
        }

        self.research_keywords = {
            "explain",
            "what",
            "why",
            "how",
            "meaning",
            "define",
            "definition",
            "learn",
            "study",
            "research",
            "compare",
            "difference",
            "differences",
            "information",
            "facts",
            "describe",
            "understand",
            "concept",
            "concepts",
            "theory",
            "advantages",
            "disadvantages",
            "example",
            "examples",
            "summarize",
            "summary",
        }

        self.writing_keywords = {
            "write",
            "rewrite",
            "rephrase",
            "paraphrase",
            "edit",
            "proofread",
            "improve",
            "essay",
            "email",
            "article",
            "caption",
            "paragraph",
            "letter",
            "story",
        }

        self.document_keywords = {
            "report",
            "documentation",
            "document",
            "assignment",
            "project report",
            "lab record",
            "proposal",
            "resume",
            "cv",
        }

    def _keyword_score(self, task: str, keywords: set[str]) -> float:
        """
        Calculate a lightweight intent score.

        Exact word matches receive a small score.
        Multi-word phrases are also supported.
        """

        text = task.lower()

        score = 0.0

        for keyword in keywords:
            if " " in keyword:
                if keyword in text:
                    score += 1.0
            else:
                words = set(
                    text.replace(",", " ")
                    .replace(".", " ")
                    .replace("?", " ")
                    .replace("!", " ")
                    .split()
                )

                if keyword in words:
                    score += 1.0

        return score

    async def analyze(self, task: str) -> TaskAnalysis:

        if not task or not task.strip():
            raise ValueError("Task cannot be empty.")

        task = task.strip()

        # ---------------------------------------------------------
        # 1. Encode user task
        # ---------------------------------------------------------

        task_embedding = self.model.encode(
            task,
            convert_to_tensor=True
        )

        # ---------------------------------------------------------
        # 2. Semantic similarity
        # ---------------------------------------------------------

        similarities = util.cos_sim(
            task_embedding,
            self.agent_embeddings
        )[0]

        semantic_scores = {
            agent: float(similarities[index].item())
            for index, agent in enumerate(self.agent_names)
        }

        # ---------------------------------------------------------
        # 3. Intent keyword signals
        # ---------------------------------------------------------

        keyword_scores = {
            "coding": self._keyword_score(
                task,
                self.coding_keywords,
            ),

            "research": self._keyword_score(
                task,
                self.research_keywords,
            ),

            "writing": self._keyword_score(
                task,
                self.writing_keywords,
            ),

            "document": self._keyword_score(
                task,
                self.document_keywords,
            ),
        }

        # ---------------------------------------------------------
        # 4. Combine semantic + intent scores
        # ---------------------------------------------------------

        # Semantic similarity remains the main signal.
        #
        # Keyword intent provides an additional correction for
        # obvious user requests such as:
        #
        # "explain neural networks"
        # "write an email"
        # "debug this Python code"
        # "create a project report"

        combined_scores = {}

        for agent in self.agent_names:

            semantic_score = semantic_scores[agent]

            # Normalize keyword signal.
            keyword_signal = min(
                1.0,
                keyword_scores[agent] / 3.0
            )

            combined_scores[agent] = (
                0.70 * semantic_score
                + 0.30 * keyword_signal
            )

        # ---------------------------------------------------------
        # 5. Select best agent
        # ---------------------------------------------------------

        ranked_agents = sorted(
            self.agent_names,
            key=lambda agent: combined_scores[agent],
            reverse=True,
        )

        best_agent = ranked_agents[0]
        second_agent = ranked_agents[1]

        best_score = combined_scores[best_agent]
        second_score = combined_scores[second_agent]

        # ---------------------------------------------------------
        # 6. Calculate confidence
        # ---------------------------------------------------------

        margin = best_score - second_score

        confidence = min(
            1.0,
            max(
                0.0,
                margin / 0.15
            )
        )

        # ---------------------------------------------------------
        # 7. Handle ambiguous general questions
        # ---------------------------------------------------------

        # If there is no meaningful coding/writing/document intent,
        # general explanatory questions should go to Research.
        #
        # This prevents questions such as:
        #
        # "What is a neural network?"
        # "Explain TCP."
        # "Why does HTTPS use TLS?"
        #
        # from incorrectly becoming coding tasks.

        explicit_non_research = (
            keyword_scores["coding"] > 0
            or keyword_scores["writing"] > 0
            or keyword_scores["document"] > 0
        )

        if not explicit_non_research:

            research_score = keyword_scores["research"]

            if research_score > 0:

                best_agent = "research"

                # Give a reasonable confidence to clear
                # educational/general-information requests.
                confidence = max(
                    confidence,
                    0.75
                )

        # ---------------------------------------------------------
        # 8. Determine complexity
        # ---------------------------------------------------------

        word_count = len(task.split())

        if word_count > 40:
            complexity = "complex"
        elif word_count > 15:
            complexity = "medium"
        else:
            complexity = "simple"

        # ---------------------------------------------------------
        # 9. Map agent to task type
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
                "explanation",
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
        # 10. Return structured analysis
        # ---------------------------------------------------------

        return TaskAnalysis(
            task_type=task_type_map[best_agent],
            capabilities=capability_map[best_agent],
            complexity=complexity,
            recommended_agent=best_agent,
            confidence=confidence,
            routing_method="semantic",
        )