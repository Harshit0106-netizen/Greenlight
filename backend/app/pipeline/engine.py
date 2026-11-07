"""Runs steps 1 to 6 and returns verified, scored findings (plain dicts in the contract's shape)."""
import logging

from app.pipeline import Candidate, PipelineResult, SourceView
from app.pipeline.judge import JudgeUnavailable, LLMProvider, NullProvider, get_provider
from app.pipeline.retriever import get_embedder, retrieve
from app.pipeline.rules import run_rules
from app.pipeline.scorer import _RANK, apply_label, score
from app.pipeline.splitter import split
from app.pipeline.verifier import verify

log = logging.getLogger("greenlight.engine")
MAX_JUDGE_SENTENCES = 40
JUDGE_TYPES = {"unsupported_claim", "contradicted_claim", "tone"}


def _finding(c: Candidate, confidence: float) -> dict:
    return {
        "type": c.type, "severity": c.severity,
        "span": {"start": c.start, "end": c.end, "text": c.text},
        "source": c.source, "fact_match": c.fact_match, "reason": c.reason,
        "confidence": confidence, "method": c.method, "suggestion": c.suggestion,
    }


def _judge_candidates(item: dict, seg, sent: dict[str, SourceView], text: str, scores: dict[str, float]) -> Candidate | None:
    ftype = item.get("type")
    quote = item.get("quote")
    if ftype not in JUDGE_TYPES or not isinstance(quote, str) or not quote:
        return None
    sid = str(item.get("source_id"))
    src = sent.get(sid)
    source = ({"kind": src.kind, "id": src.id, "version": src.version} if src
              else {"kind": "guideline", "id": sid, "version": ""})  # unknown source: the verifier will drop it
    idx = text.find(quote, seg.start, seg.end)
    try:
        certainty = float(item.get("certainty", 0.5))
    except (TypeError, ValueError):
        certainty = 0.5
    fid = item.get("fact_id") if isinstance(item.get("fact_id"), str) else None
    fact = sent.get(fid) if fid else None
    suggestion = None
    if isinstance(item.get("suggestion"), str) and item["suggestion"].strip():
        suggestion = {"text": item["suggestion"].strip(), "fact_id": fid, "applied": False}
    fact_match = None
    if ftype == "contradicted_claim" and fid:
        fact_match = {"id": fid, "version": fact.version if fact else None, "text": fact.text if fact else None}
    return Candidate(
        type=ftype, severity=str(item.get("severity")), start=idx, end=idx + len(quote) if idx >= 0 else -1,
        text=quote, reason=str(item.get("reason", "")).strip()[:400], method="ai_assisted", certainty=certainty,
        source=source, fact_match=fact_match, suggestion=suggestion,
        retrieval_score=scores.get(sid, 0.0), segment_start=seg.start, segment_end=seg.end,
    )


def run_pipeline(text: str, kit: list[SourceView], provider: LLMProvider | None = None, embedder=None) -> PipelineResult:
    provider = provider or get_provider()
    embedder = embedder or get_embedder()
    valid = {s.id: s for s in kit}
    result = PipelineResult(findings=[], mode="full")

    # 1 split
    sentences, structure = split(text)
    # 2 rules
    candidates = run_rules(text, sentences, structure, kit)
    # 3 retrieve
    matches = retrieve([s.text for s in sentences], kit, embedder)
    by_start = {s.start: i for i, s in enumerate(sentences)}
    for c in candidates:  # attach approved-fact suggestions to unsupported claims (never invented text)
        if c.type != "unsupported_claim" or c.suggestion:
            continue
        i = by_start.get(c.segment_start)
        facts = [m for m in matches[i] if m.source.kind == "fact"] if i is not None else []
        if facts:
            c.suggestion = {"text": facts[0].source.text, "fact_id": facts[0].source.id, "applied": False}
            c.retrieval_score = facts[0].score

    # 4 judge
    if isinstance(provider, NullProvider):
        result.mode = "rules_only"
        result.notes.append("LLM unavailable: ran rules only.")
    else:
        result.model = provider.name
        targets = [(i, s) for i, s in enumerate(sentences) if matches[i]][:MAX_JUDGE_SENTENCES]
        for i, seg in targets:
            sent_sources = [m.source for m in matches[i]]
            scores = {m.source.id: m.score for m in matches[i]}
            result.judge_calls += 1
            try:
                items = provider.judge(seg.text, sent_sources)
            except (JudgeUnavailable, ValueError) as exc:
                result.judge_failures += 1
                log.warning("Judge call failed: %s", exc)
                continue
            result.sentences_sent += 1
            result.sources_sent += len(sent_sources)
            by_id = {s.id: s for s in sent_sources}
            for item in items:
                cand = _judge_candidates(item, seg, by_id, text, scores)
                if cand is None:
                    result.dropped_unverified += 1
                else:
                    candidates.append(cand)
        if result.judge_calls and result.judge_failures == result.judge_calls:
            result.mode = "rules_only"
            result.notes.append("LLM calls all failed: ran rules only.")
        elif result.judge_failures:
            result.notes.append(f"{result.judge_failures} LLM call(s) failed; those sentences were checked by rules only.")

    # 5 verify  +  6 score
    accepted: list[dict] = []
    for c in candidates:
        conf = score(c.method, c.certainty, c.retrieval_score, embedder.high_score)
        f = _finding(c, conf)
        if not verify(f, text, valid):
            result.dropped_unverified += 1
            continue
        accepted.append(apply_label(f))

    # one finding per stretch of text: strongest first, rules win ties
    accepted.sort(key=lambda f: (_RANK[f["severity"]], -f["confidence"], f["method"] != "rule_based", f["span"]["start"]))
    kept: list[dict] = []
    for f in accepted:
        a, b = f["span"]["start"], f["span"]["end"]
        if any(a < k["span"]["end"] and b > k["span"]["start"] for k in kept):
            continue
        kept.append(f)
    kept.sort(key=lambda f: (_RANK[f["severity"]], f["span"]["start"]))
    result.findings = kept
    return result
