import pytest
from sqlalchemy import select

from conftest import make_user, login, resolve_all, submit
from app.database import SessionLocal
from app.errors import ApiError
from app.models import AuditEvent, Review
from app.services.workflow_service import TRANSITIONS, transition

DRAFT = "We offer #1 fastest delivery, guaranteed. Buy the Zippy bottle now!!"


def status(client, h, rid):
    return client.get(f"/reviews/{rid}", headers=h).json()["status"]


def test_happy_path_scanned_resolving_in_review_approved(client, h):
    out = submit(client, h["creator"], DRAFT)
    rid = out["id"]
    assert out["status"] == "scanned" and out["finding_count"] >= 3
    findings = client.get(f"/reviews/{rid}/findings", headers=h["creator"]).json()
    client.patch(f"/findings/{findings[0]['finding_id']}", headers=h["creator"],
                 json={"action": "disputed", "reason": "We hold an award.", "edited_text": None})
    assert status(client, h["creator"], rid) == "resolving"
    resolve_all(client, h["creator"], rid)
    assert status(client, h["creator"], rid) == "in_review"
    r = client.post(f"/reviews/{rid}/approve", headers=h["reviewer"], json={"note": "Looks good after edits."})
    assert r.status_code == 200 and r.json() == {"id": rid, "status": "approved"}


def test_accepted_but_unfixed_blocks_in_review(client, h):
    rid = submit(client, h["creator"])["id"]
    fid = client.get(f"/reviews/{rid}/findings", headers=h["creator"]).json()[0]["finding_id"]
    client.patch(f"/findings/{fid}", headers=h["creator"], json={"action": "accepted", "reason": "", "edited_text": None})
    assert status(client, h["creator"], rid) == "resolving"


def test_dispute_needs_a_reason_and_edit_needs_text(client, h):
    rid = submit(client, h["creator"])["id"]
    fid = client.get(f"/reviews/{rid}/findings", headers=h["creator"]).json()[0]["finding_id"]
    assert client.patch(f"/findings/{fid}", headers=h["creator"], json={"action": "disputed", "reason": "  "}).status_code == 422
    assert client.patch(f"/findings/{fid}", headers=h["creator"], json={"action": "edited", "edited_text": ""}).status_code == 422
    assert status(client, h["creator"], rid) == "scanned"  # nothing changed


def test_clean_draft_goes_straight_to_in_review(client, h):
    out = submit(client, h["creator"], "The Zippy Bottle has a 750 ml capacity.")
    assert out == {"id": out["id"], "status": "in_review", "finding_count": 0}


def test_cannot_approve_until_in_review(client, h):
    rid = submit(client, h["creator"])["id"]
    # reviewers cannot even see it yet; once visible, wrong state is a validation error
    resolve_all(client, h["creator"], rid)
    assert client.post(f"/reviews/{rid}/approve", headers=h["reviewer"], json={"note": ""}).status_code == 200
    r = client.post(f"/reviews/{rid}/approve", headers=h["reviewer"], json={"note": ""})
    assert r.status_code == 422 and r.json()["error"]["code"] == "validation_error"


def test_approved_is_final_and_findings_lock(client, h):
    rid = submit(client, h["creator"])["id"]
    resolve_all(client, h["creator"], rid)
    client.post(f"/reviews/{rid}/approve", headers=h["reviewer"], json={"note": ""})
    fid = client.get(f"/reviews/{rid}/findings", headers=h["creator"]).json()[0]["finding_id"]
    r = client.patch(f"/findings/{fid}", headers=h["creator"], json={"action": "disputed", "reason": "late"})
    assert r.status_code == 422
    assert client.post(f"/reviews/{rid}/request-changes", headers=h["reviewer"], json={"note": "x"}).status_code == 422


def test_findings_lock_while_waiting_for_the_reviewer(client, h):
    rid = submit(client, h["creator"])["id"]
    resolve_all(client, h["creator"], rid)
    fid = client.get(f"/reviews/{rid}/findings", headers=h["creator"]).json()[0]["finding_id"]
    assert client.patch(f"/findings/{fid}", headers=h["creator"], json={"action": "disputed", "reason": "x"}).status_code == 422


def test_request_changes_needs_a_note_then_loop_back(client, h):
    rid = submit(client, h["creator"])["id"]
    resolve_all(client, h["creator"], rid)
    assert client.post(f"/reviews/{rid}/request-changes", headers=h["reviewer"], json={"note": " "}).status_code == 422
    r = client.post(f"/reviews/{rid}/request-changes", headers=h["reviewer"], json={"note": "Confirm cities with legal."})
    assert r.json()["status"] == "changes_requested"
    fid = client.get(f"/reviews/{rid}/findings", headers=h["creator"]).json()[0]["finding_id"]
    client.patch(f"/findings/{fid}", headers=h["creator"], json={"action": "edited", "reason": "Confirmed", "edited_text": "Fast delivery is available in select cities"})
    assert status(client, h["creator"], rid) == "in_review"  # everything resolved again


def test_editing_updates_content_and_shifts_later_spans(client, h):
    rid = submit(client, h["creator"], DRAFT)["id"]
    findings = client.get(f"/reviews/{rid}/findings", headers=h["creator"]).json()
    first = min(findings, key=lambda f: f["span"]["start"])
    client.patch(f"/findings/{first['finding_id']}", headers=h["creator"],
                 json={"action": "edited", "reason": "", "edited_text": "Fast delivery is available in select cities"})
    content = client.get(f"/reviews/{rid}", headers=h["creator"]).json()["content"]
    after = client.get(f"/reviews/{rid}/findings", headers=h["creator"]).json()
    assert len(after) == len(findings)
    for f in after:  # every span still points at exactly its quoted text
        assert content[f["span"]["start"]:f["span"]["end"]] == f["span"]["text"]
    edited = next(f for f in after if f["finding_id"] == first["finding_id"])
    assert edited["span"]["text"] == "Fast delivery is available in select cities"
    assert edited["decision"]["action"] == "edited" and edited["decision"]["actor"].startswith("U-")


def test_applying_the_suggestion_marks_it_applied(client, h):
    rid = submit(client, h["creator"])["id"]
    f = client.get(f"/reviews/{rid}/findings", headers=h["creator"]).json()[0]
    client.patch(f"/findings/{f['finding_id']}", headers=h["creator"],
                 json={"action": "edited", "reason": "", "edited_text": f["suggestion"]["text"]})
    again = client.get(f"/reviews/{rid}/findings", headers=h["creator"]).json()[0]
    assert again["suggestion"]["applied"] is True


def test_every_step_is_audited_with_actor_time_and_reason(client, h):
    rid = submit(client, h["creator"])["id"]
    fid = client.get(f"/reviews/{rid}/findings", headers=h["creator"]).json()[0]["finding_id"]
    client.patch(f"/findings/{fid}", headers=h["creator"], json={"action": "disputed", "reason": "We hold an award."})
    with SessionLocal() as db:
        events = db.scalars(select(AuditEvent).where(AuditEvent.review_id == rid).order_by(AuditEvent.pk)).all()
    kinds = [e.event_type for e in events]
    assert kinds[:2] == ["review_submitted", "scan_completed"] and "finding_decision" in kinds
    decision = next(e for e in events if e.event_type == "finding_decision")
    assert decision.actor_id and decision.reason == "We hold an award." and decision.created_at
    assert next(e for e in events if e.event_type == "scan_completed").actor_id is None  # system, not a person


def test_state_machine_table_forbids_skipping_human_approval():
    assert "approved" not in TRANSITIONS["scanned"] | TRANSITIONS["resolving"] | TRANSITIONS["changes_requested"]
    assert TRANSITIONS["approved"] == set()
    with SessionLocal() as db:
        r = Review(id="CL-X", workspace_id="W-1", creator_id="U-1", title="t", brand_kit_version=1, status="scanned")
        with pytest.raises(ApiError):
            transition(db, r, "approved", None)
