import os

# Must be set before the app is imported. Default: SQLite file. For the real stack:
#   TEST_DATABASE_URL=postgresql://greenlight:greenlight@localhost:5432/greenlight_test pytest
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", "sqlite:///./test_greenlight.db")
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["JWT_SECRET"] = "test-secret"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, ensure_extensions, engine, next_number  # noqa: E402
from app.main import app  # noqa: E402
from app.models import User  # noqa: E402
from app.pipeline import judge as judge_mod  # noqa: E402
from app.pipeline.judge import NullProvider  # noqa: E402
from app.security import hash_password  # noqa: E402
from app.seed import seed  # noqa: E402

PASSWORD = "greenlight-demo"
CREATOR, MANAGER, REVIEWER, ADMIN = "aarav@acme.com", "harshit@acme.com", "priya@acme.com", "ruchir@acme.com"


@pytest.fixture(autouse=True)
def fresh_db(monkeypatch):
    Base.metadata.drop_all(engine)
    ensure_extensions()
    Base.metadata.create_all(engine)
    seed()
    # default: no LLM (rules-only). Tests that want a judge monkeypatch app.pipeline.engine.get_provider.
    monkeypatch.setattr("app.pipeline.engine.get_provider", lambda: NullProvider())
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def login(client, email, password=PASSWORD):
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def h(client):
    """headers per role"""
    return {k: login(client, e) for k, e in
            {"creator": CREATOR, "manager": MANAGER, "reviewer": REVIEWER, "admin": ADMIN}.items()}


def submit(client, headers, content="We offer #1 fastest delivery, guaranteed.", title="Summer launch"):
    r = client.post("/reviews", headers=headers, json={"title": title, "content": content, "intent_note": "test"})
    assert r.status_code == 201, r.text
    return r.json()


def resolve_all(client, headers, review_id):
    """Edit every finding with its suggestion (or a neutral replacement) until nothing is open."""
    for f in client.get(f"/reviews/{review_id}/findings", headers=headers).json():
        text = (f["suggestion"] or {}).get("text") or "Reworded."
        r = client.patch(f"/findings/{f['finding_id']}", headers=headers,
                         json={"action": "edited", "reason": "", "edited_text": text})
        assert r.status_code == 200, r.text


def make_user(email, role, workspace_id="W-1", name="Test User"):
    with SessionLocal() as db:
        u = User(id=f"U-{next_number(db, 'user', 1)}", workspace_id=workspace_id, name=name, email=email,
                 password_hash=hash_password(PASSWORD), role=role)
        db.add(u)
        db.commit()
        return u.id
