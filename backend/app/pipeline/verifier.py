"""Step 5. The verifier. Non-negotiable: anything it cannot confirm is dropped.

Checks: the quoted text really sits at the stated position in the draft; the source ID exists in the Brand Kit
version used for the review (and its kind/version match); a suggestion cannot introduce a claim without an
approved fact ID. Failing any check drops the finding.
"""
from collections.abc import Mapping

from app.pipeline.rules import CLAIMS

TYPES = {"unsupported_claim", "contradicted_claim", "terminology", "tone", "accessibility", "visual"}
SEVERITIES = {"high", "medium", "low"}
METHODS = {"rule_based", "ai_assisted"}
CLAIM_TYPES = {"unsupported_claim", "contradicted_claim"}
SOURCELESS_OK = {"accessibility"}  # built-in WCAG rules cite the rule and the exact span


def _norm(s: str) -> str:
    return " ".join(s.lower().split()).rstrip(".")


def verify(finding: dict, draft_text: str, valid_sources) -> bool:
    """valid_sources: a set of source IDs, or a mapping id -> SourceView (enables kind/version/fact checks)."""
    try:
        s = finding["span"]
        start, end, text = s["start"], s["end"], s["text"]
        if not isinstance(start, int) or not isinstance(end, int) or not text:
            return False
        if not (0 <= start < end <= len(draft_text)) or draft_text[start:end] != text:
            return False  # quote is not really in the draft

        if finding.get("type") not in TYPES or finding.get("severity") not in SEVERITIES:
            return False
        if finding.get("method") not in METHODS or not finding.get("reason"):
            return False
        conf = finding.get("confidence")
        if conf is not None and not (0.0 <= conf <= 1.0):
            return False

        detailed = isinstance(valid_sources, Mapping)
        ids = set(valid_sources.keys()) if detailed else set(valid_sources)

        src = finding.get("source")
        if src is None:
            if not (finding["method"] == "rule_based" and finding["type"] in SOURCELESS_OK):
                return False  # no source, no finding
        else:
            if src["id"] not in ids:
                return False  # source was invented
            if detailed:
                ref = valid_sources[src["id"]]
                if ref.version != src.get("version") or ref.kind != src.get("kind"):
                    return False  # wrong version or kind for this review's Brand Kit

        fm = finding.get("fact_match")
        if fm:
            if fm["id"] not in ids or (detailed and valid_sources[fm["id"]].kind != "fact"):
                return False

        sug = finding.get("suggestion")
        if sug:
            fact_id = sug.get("fact_id")
            if fact_id:
                if fact_id not in ids:
                    return False
                if detailed:
                    fact = valid_sources[fact_id]
                    if fact.kind != "fact" or _norm(sug["text"]) not in _norm(fact.text):
                        return False  # suggestion must reuse approved wording
            elif finding["method"] == "ai_assisted":
                # An AI suggestion without an approved fact must not introduce a claim.
                if finding["type"] in CLAIM_TYPES or CLAIMS.search(sug["text"]):
                    return False
        return True
    except (KeyError, TypeError):
        return False
