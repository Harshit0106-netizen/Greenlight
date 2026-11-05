"""AI-use record: what was and was not sent to an AI service for a review. Counts only, never draft text."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit import AiCallLog
from app.pipeline import PipelineResult
from app.schemas.review import AiDisclosure, DisclosureStep


def record(db: Session, review_id: str, result: PipelineResult) -> None:
    db.add(AiCallLog(review_id=review_id, step="rules", used_ai=False, note="Deterministic checks"))
    db.add(AiCallLog(review_id=review_id, step="retrieve", used_ai=False,
                     note="Embeddings computed on our own server; nothing sent out"))
    used = result.sentences_sent > 0
    db.add(AiCallLog(
        review_id=review_id, step="judge", used_ai=used, model=result.model if used else None,
        sentences_sent=result.sentences_sent, sources_sent=result.sources_sent, success=result.judge_failures == 0,
        note="; ".join(result.notes) or ("" if used else "Rules-only mode: no AI used"),
    ))


def build(db: Session, review_id: str) -> AiDisclosure:
    rows = db.scalars(select(AiCallLog).where(AiCallLog.review_id == review_id).order_by(AiCallLog.pk)).all()
    steps: list[DisclosureStep] = []
    for r in rows:
        if r.step == "judge" and r.used_ai:
            data = f"{r.sentences_sent} sentence(s) + {r.sources_sent} matched source(s)"
            steps.append(DisclosureStep(step="judge", used_ai=True, model=r.model, data_sent=data))
        elif r.step == "judge":
            steps.append(DisclosureStep(step="judge", used_ai=False, data_sent="none (rules-only mode: LLM unavailable)"))
        elif r.step == "retrieve":
            steps.append(DisclosureStep(step="retrieve", used_ai=False, data_sent="none (embeddings computed on our own server)"))
        else:
            steps.append(DisclosureStep(step=r.step, used_ai=False))
    return AiDisclosure(review_id=review_id, steps=steps)
