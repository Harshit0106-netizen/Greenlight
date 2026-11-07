"""Step 6. Confidence from retrieval match, judge certainty and rule type. Low confidence is labelled, not asserted."""
LOW_CONFIDENCE = 0.60
_RANK = {"high": 0, "medium": 1, "low": 2}


def score(method: str, certainty: float, retrieval_score: float, high_score: float) -> float:
    certainty = max(0.0, min(1.0, certainty))
    if method == "rule_based":
        return round(certainty, 2)
    retrieval = max(0.0, min(1.0, retrieval_score / high_score)) if high_score else 0.0
    return round(0.7 * certainty + 0.3 * retrieval, 2)


def apply_label(finding: dict) -> dict:
    """Cap severity at medium and say so in the reason when confidence is low."""
    if finding["confidence"] < LOW_CONFIDENCE:
        if _RANK[finding["severity"]] < _RANK["medium"]:
            finding["severity"] = "medium"
        finding["reason"] = f"{finding['reason']} Low confidence: please verify manually."
    return finding
