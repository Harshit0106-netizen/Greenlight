# Greenlight

**Pre-publication brand governance.** Greenlight checks draft content against a company's approved brand knowledge before it goes out, shows *why* something was flagged, and leaves the final call to a human.

Team Phoenix: Harshit Verma (frontend, lead) and Ruchir Bharadwaj (backend). The plan is in [`PROJECT.md`](PROJECT.md); the API contract is in [`docs/API.md`](docs/API.md).

## Status

| Part | State |
|---|---|
| `backend/` | **Built through v4**: auth + roles, versioned Brand Kit with pgvector embeddings, detection pipeline (split, rules, retrieve, Claude judge, verifier, scorer), review state machine, comments, audit events, insights, AI disclosure. 75 tests. |
| `frontend/` | Existing prototype. `lib/api.ts` has the mock/live switch and reads the contract's error shape. **Screens still run on the local demo store**; switching them to the API (MEET A onward) is the next step. |

## Run it

**Backend** (Python 3.11+, PostgreSQL with the `pgvector` extension)

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                 # set DATABASE_URL, JWT_SECRET (32+ chars); ANTHROPIC_API_KEY is optional
alembic upgrade head                 # creates the schema (and the vector extension)
python -m app.seed                   # fictional Acme workspace + 4 demo users
uvicorn app.main:app --reload --port 8000    # http://localhost:8000/docs
```

Demo logins (password `greenlight-demo`): `aarav@acme.com` creator, `harshit@acme.com` manager, `priya@acme.com` reviewer, `ruchir@acme.com` brand_admin.

Without `ANTHROPIC_API_KEY` the pipeline runs in **rules-only mode** and says so in the AI disclosure. With a key, one sentence plus its matched sources goes to Claude per call, and everything it returns must still pass the verifier.

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local           # NEXT_PUBLIC_USE_MOCK=true -> fake data; false -> live backend
npm run dev                          # http://localhost:3000
```

**Tests**

```bash
cd backend && pytest                                   # SQLite, no setup needed
TEST_DATABASE_URL=postgresql://user:pw@localhost/greenlight_test pytest   # real PostgreSQL + pgvector
```

## How detection works

`draft -> split -> rules -> retrieve -> judge -> verify -> score -> findings`

The verifier drops any finding whose quote is not at the stated position in the draft, whose source is not in the review's Brand Kit version (right kind and version), or whose suggestion adds a claim without an approved fact. No source, no finding. No evidence means "unsupported", never "false". Only humans approve.

## Embeddings

`sentence-transformers` (self-hosted, 384-dim) is used when installed. If it is not, a built-in hashing embedder keeps the service running, so retrieval quality is lower; install it for real use. Vectors are stored in a pgvector `vector(384)` column; similarity is computed in Python, which is fine for a Brand Kit of hundreds of sources (switch to SQL `<=>` plus an index if it grows).
