"""Step 3. Find the approved sources most relevant to each sentence (vector search, computed on our own server).

Embedder: Sentence Transformers (self-hosted) when installed; otherwise a built-in hashing embedder so the
service still runs. Both produce 384-dim unit vectors, stored in pgvector on PostgreSQL.
"""
import hashlib
import logging
import math
import re
from dataclasses import dataclass
from functools import lru_cache

from app.config import get_settings
from app.database import EMBEDDING_DIM
from app.pipeline import SourceView

log = logging.getLogger("greenlight.retriever")
_WORD = re.compile(r"[a-z0-9#%]+")
_STOP = {"the", "a", "an", "is", "are", "of", "in", "on", "to", "and", "or", "we", "our", "us", "you", "your", "it",
         "for", "with", "as", "be", "that", "this", "at", "by", "do", "not", "any", "use", "such", "than"}


class HashingEmbedder:
    name = "hashing-384"
    min_score = 0.12
    high_score = 0.35

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._one(t) for t in texts]

    @staticmethod
    def _bucket(token: str) -> tuple[int, float]:
        h = int.from_bytes(hashlib.blake2b(token.encode(), digest_size=8).digest(), "big")
        return h % EMBEDDING_DIM, 1.0 if (h >> 40) & 1 else -1.0

    def _one(self, text: str) -> list[float]:
        vec = [0.0] * EMBEDDING_DIM
        words = [w for w in _WORD.findall(text.lower()) if w not in _STOP]
        for w in words:
            i, sign = self._bucket("w:" + w)
            vec[i] += sign * 2.0
            padded = f"^{w}$"
            for j in range(len(padded) - 2):
                i, sign = self._bucket("t:" + padded[j : j + 3])
                vec[i] += sign * 0.5
        norm = math.sqrt(sum(x * x for x in vec))
        return [x / norm for x in vec] if norm else vec


class SentenceTransformerEmbedder:
    min_score = 0.30
    high_score = 0.55

    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer  # heavy import, only when available

        self._model = SentenceTransformer(model_name)
        self.name = f"st:{model_name}"
        if self._model.get_sentence_embedding_dimension() != EMBEDDING_DIM:
            raise ValueError("Embedding model must produce 384-dimension vectors.")

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [list(map(float, v)) for v in self._model.encode(texts, normalize_embeddings=True)]


@lru_cache
def get_embedder():
    try:
        return SentenceTransformerEmbedder(get_settings().embedding_model)
    except Exception as exc:  # not installed, offline, wrong size...
        log.warning("Sentence Transformers unavailable (%s); using the built-in hashing embedder.", exc)
        return HashingEmbedder()


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))  # vectors are unit length


@dataclass
class Match:
    source: SourceView
    score: float


def source_text(s: SourceView) -> str:
    return f"{s.title}. {s.text}"


def retrieve(sentences: list[str], sources: list[SourceView], embedder=None, k: int = 3) -> list[list[Match]]:
    """For each sentence, the top-k guideline/fact sources above the embedder's relevance floor."""
    embedder = embedder or get_embedder()
    pool = [s for s in sources if s.kind in ("guideline", "fact")]
    if not pool or not sentences:
        return [[] for _ in sentences]
    missing = [s for s in pool if s.embedding is None]
    if missing:
        for s, v in zip(missing, embedder.embed([source_text(x) for x in missing])):
            s.embedding = v
    out: list[list[Match]] = []
    for vec in embedder.embed(sentences):
        scored = sorted((Match(s, cosine(vec, s.embedding)) for s in pool), key=lambda m: -m.score)
        out.append([m for m in scored[:k] if m.score >= embedder.min_score])
    return out
