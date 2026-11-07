"""The verifier is the one thing we never cut."""
from app.pipeline import SourceView
from app.pipeline.verifier import verify

DRAFT = "We offer #1 fastest delivery, guaranteed."
KIT = {
    "G-4.2": SourceView("G-4.2", "guideline", "Superlatives", "No unsupported superlatives.", "v3"),
    "F-12": SourceView("F-12", "fact", "Delivery", "Fast delivery is available in select cities.", "v3"),
}


def finding(**over):
    f = {"type": "unsupported_claim", "severity": "high",
         "span": {"start": 9, "end": 40, "text": "#1 fastest delivery, guaranteed"},
         "source": {"kind": "guideline", "id": "G-4.2", "version": "v3"}, "fact_match": None,
         "reason": "No approved fact supports this.", "confidence": 0.9, "method": "ai_assisted", "suggestion": None}
    f.update(over)
    return f


def test_valid_finding_passes_with_id_set_and_with_full_kit():
    assert verify(finding(), DRAFT, {"G-4.2"})          # plan's original signature
    assert verify(finding(), DRAFT, KIT)


def test_quote_not_at_stated_position_is_dropped():
    assert not verify(finding(span={"start": 0, "end": 31, "text": "#1 fastest delivery, guaranteed"}), DRAFT, KIT)
    assert not verify(finding(span={"start": 9, "end": 40, "text": "invented words not in the draft!"}), DRAFT, KIT)


def test_out_of_bounds_or_empty_span_is_dropped():
    assert not verify(finding(span={"start": 9, "end": 999, "text": "x"}), DRAFT, KIT)
    assert not verify(finding(span={"start": 5, "end": 5, "text": ""}), DRAFT, KIT)
    assert not verify(finding(span={"start": -1, "end": -1, "text": "x"}), DRAFT, KIT)


def test_invented_source_id_is_dropped():
    assert not verify(finding(source={"kind": "guideline", "id": "G-99", "version": "v3"}), DRAFT, KIT)


def test_wrong_source_version_or_kind_is_dropped():
    assert not verify(finding(source={"kind": "guideline", "id": "G-4.2", "version": "v1"}), DRAFT, KIT)
    assert not verify(finding(source={"kind": "fact", "id": "G-4.2", "version": "v3"}), DRAFT, KIT)


def test_no_source_means_no_finding_except_builtin_accessibility_rules():
    assert not verify(finding(source=None), DRAFT, KIT)
    assert not verify(finding(source=None, method="ai_assisted", type="accessibility"), DRAFT, KIT)
    assert verify(finding(source=None, method="rule_based", type="accessibility"), DRAFT, KIT)


def test_ai_suggestion_cannot_add_a_claim_without_an_approved_fact():
    assert not verify(finding(suggestion={"text": "The fastest delivery around", "fact_id": None, "applied": False}), DRAFT, KIT)
    assert not verify(finding(suggestion={"text": "Delivery coverage is wide", "fact_id": None, "applied": False}), DRAFT, KIT)  # claim type needs a fact
    assert not verify(finding(suggestion={"text": "Fast delivery everywhere", "fact_id": "F-99", "applied": False}), DRAFT, KIT)


def test_suggestion_must_reuse_the_approved_fact_wording():
    ok = {"text": "Fast delivery is available in select cities", "fact_id": "F-12", "applied": False}
    assert verify(finding(suggestion=ok), DRAFT, KIT)
    bad = {"text": "Fast delivery is available worldwide", "fact_id": "F-12", "applied": False}
    assert not verify(finding(suggestion=bad), DRAFT, KIT)


def test_fact_match_must_be_a_real_fact():
    assert verify(finding(type="contradicted_claim", fact_match={"id": "F-12"}), DRAFT, KIT)
    assert not verify(finding(type="contradicted_claim", fact_match={"id": "G-4.2"}), DRAFT, KIT)
    assert not verify(finding(type="contradicted_claim", fact_match={"id": "F-404"}), DRAFT, KIT)


def test_malformed_findings_never_raise_they_just_fail():
    assert not verify({}, DRAFT, KIT)
    assert not verify(finding(severity="catastrophic"), DRAFT, KIT)
    assert not verify(finding(confidence=1.7), DRAFT, KIT)
    assert not verify(finding(reason=""), DRAFT, KIT)
