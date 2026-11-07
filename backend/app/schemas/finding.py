from typing import Literal

from pydantic import BaseModel

from app.schemas.brand_kit import SourceKind

FindingType = Literal["unsupported_claim", "contradicted_claim", "terminology", "tone", "accessibility", "visual"]
Severity = Literal["high", "medium", "low"]
Method = Literal["rule_based", "ai_assisted"]
Action = Literal["accepted", "edited", "disputed"]


class Span(BaseModel):
    start: int
    end: int
    text: str


class FindingSource(BaseModel):
    kind: SourceKind
    id: str
    version: str


class FactMatch(BaseModel):
    id: str
    version: str | None = None
    text: str | None = None


class Suggestion(BaseModel):
    text: str
    fact_id: str | None = None
    applied: bool = False


class Decision(BaseModel):
    action: Action
    reason: str
    actor: str


class FindingOut(BaseModel):
    finding_id: str
    type: FindingType
    severity: Severity
    span: Span
    source: FindingSource | None
    fact_match: FactMatch | None
    reason: str
    confidence: float
    method: Method
    suggestion: Suggestion | None
    decision: Decision | None


class FindingPatch(BaseModel):
    action: Action
    reason: str = ""
    edited_text: str | None = None


class FindingPatchOut(BaseModel):
    finding_id: str
    decision: Decision
