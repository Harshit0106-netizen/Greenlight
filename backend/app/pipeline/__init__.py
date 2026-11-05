"""Detection pipeline: draft -> 1 split -> 2 rules -> 3 retrieve -> 4 judge -> 5 verify -> 6 score -> findings.

Shared plain-data types live here so each step stays small and testable on its own.
"""
from dataclasses import dataclass, field


@dataclass
class SourceView:
    """An approved Brand Kit source as the pipeline sees it (read-only snapshot for one Brand Kit version)."""

    id: str
    kind: str  # guideline | fact | term | asset
    title: str
    text: str
    version: str  # e.g. "v3"
    embedding: list[float] | None = None


@dataclass
class Segment:
    kind: str  # sentence | heading | image | link
    text: str
    start: int
    end: int
    extra: dict = field(default_factory=dict)


@dataclass
class Candidate:
    """A possible finding. Nothing here is trusted until the verifier passes it."""

    type: str
    severity: str
    start: int
    end: int
    text: str
    reason: str
    method: str  # rule_based | ai_assisted
    certainty: float  # rule strength or judge self-reported certainty, 0..1
    source: dict | None = None  # {"kind","id","version"}
    fact_match: dict | None = None
    suggestion: dict | None = None  # {"text","fact_id","applied"}
    retrieval_score: float = 0.0
    segment_start: int = 0  # start offset of the sentence this came from (for retrieval-based enrichment)
    segment_end: int = 0
    rule_id: str = ""


@dataclass
class PipelineResult:
    findings: list[dict]
    mode: str  # full | rules_only
    sentences_sent: int = 0
    sources_sent: int = 0
    judge_calls: int = 0
    judge_failures: int = 0
    dropped_unverified: int = 0
    model: str | None = None
    notes: list[str] = field(default_factory=list)
