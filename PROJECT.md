# Greenlight

**Pre-publication brand governance.** Greenlight checks draft content against a company's approved brand knowledge before it goes out, shows *why* something was flagged, and leaves the final call to a human.

**Team Phoenix** · Harshit Verma (frontend, product flow, team lead) · Ruchir Bharadwaj (backend, pipeline, API)

---

## Why this document exists

This is the single source of truth for the build. It does four jobs:

1. **Tells any AI tool what we are building** so generated code matches the plan.
2. **Locks the tech stack** so nothing drifts mid-build.
3. **Defines the versions** (what gets built, in what order, on which track).
4. **Defines how we work together** so frontend and backend move in parallel without stepping on each other.

If you are an AI assistant reading this: follow the rules in the next section before writing any code.

---

## Rules for AI assistants

- **Do not change the tech stack.** Use only what is listed under *Tech stack*.
- **Do not rename, remove or reshape API endpoints or fields.** The contract in `docs/API.md` (reproduced below) is fixed. If a change seems necessary, say so instead of making it.
- **Stay inside the owner's folder.** Backend work goes in `backend/`, frontend work in `frontend/`. Never edit the other side.
- **Mock first.** Backend endpoints return contract-shaped fake JSON before real logic exists. Frontend reads through `lib/api.ts` with a mock switch.
- **The AI model never decides.** Every finding must trace to an approved source ID and a real quoted span, or it is dropped.
- **No evidence means "unsupported", never "false".**
- **Never hardcode secrets.** Keys live in `.env` files, which are never committed.
- Check which **version** (see *Version roadmap*) is currently being built and do not jump ahead.

---

## Current state

| Part | Status |
|---|---|
| Frontend | Prototype with demo data: Dashboard, Brand Kit, Content Reviews, Findings and Evidence, Approvals |
| Backend | Architecture, data model, API contract and pipeline designed; implementation follows in the build versions |
| Claude API | Planned integration, not yet connected |

---

## How the pieces fit

```
Browser
   │
Next.js frontend (localhost:3000)          ← Harshit
   │   REST + JSON  (the contract)
FastAPI backend  (localhost:8000)          ← Ruchir
   ├── PostgreSQL + pgvector
   ├── Private file storage
   ├── Local embeddings (Sentence Transformers)
   └── Claude API (planned, minimal data sent)
```

- The frontend only talks to the backend through the API. Never to the database.
- The backend only returns JSON. It never renders pages.
- The **contract** is the handshake. If both sides honour it, the halves plug together.

---

## Tech stack

| Area | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic |
| Data | PostgreSQL, pgvector |
| Retrieval | Sentence Transformers (self-hosted) |
| AI analysis | Claude API (planned), behind a provider adapter |
| File parsing | python-docx, pdfplumber, Pillow |
| Auth | JWT with role-based access control |

---

## Repo structure

```
greenlight/
├── PROJECT.md                  ← this file
├── README.md
├── .gitignore
├── docs/
│   └── API.md                  ← the contract (shared, changes need both of us)
│
├── frontend/                   ← Harshit
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app/                        ← one folder = one page
│       │   ├── login/page.tsx
│       │   ├── dashboard/page.tsx
│       │   ├── brand-kit/page.tsx
│       │   ├── reviews/
│       │   │   ├── page.tsx            ← all submissions
│       │   │   ├── new/page.tsx        ← submit a draft
│       │   │   └── [id]/page.tsx       ← findings for one review
│       │   └── approvals/page.tsx
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── Topbar.tsx
│       │   ├── StatCard.tsx
│       │   ├── ReviewTable.tsx
│       │   ├── FindingCard.tsx
│       │   └── SeverityBadge.tsx
│       ├── lib/
│       │   ├── api.ts                  ← every backend call goes through here
│       │   └── mockData.ts             ← fake data in contract shape
│       └── types/
│           └── contract.ts             ← TypeScript mirror of the contract
│
└── backend/                    ← Ruchir
    ├── requirements.txt
    ├── .env.example
    ├── app/
    │   ├── main.py                     ← server, CORS, routers
    │   ├── config.py                   ← reads .env
    │   ├── database.py                 ← PostgreSQL connection
    │   ├── security.py                 ← hashing, JWT
    │   ├── dependencies.py             ← current user and role
    │   ├── models/                     ← database tables
    │   │   ├── user.py                 ← workspace, user, role
    │   │   ├── brand_kit.py            ← brand_kit_version, source_item
    │   │   ├── review.py               ← review, review_version
    │   │   ├── finding.py              ← finding, finding_decision
    │   │   └── audit.py                ← comment, approval, audit_event, ai_call_log
    │   ├── schemas/                    ← Pydantic shapes = the contract in code
    │   │   ├── auth.py
    │   │   ├── brand_kit.py
    │   │   ├── review.py
    │   │   └── finding.py
    │   ├── routers/                    ← thin endpoints
    │   │   ├── auth.py
    │   │   ├── brand_kit.py
    │   │   ├── reviews.py
    │   │   ├── findings.py
    │   │   ├── approvals.py
    │   │   └── insights.py
    │   ├── services/                   ← real logic
    │   │   ├── brand_kit_service.py
    │   │   ├── workflow_service.py
    │   │   ├── insights_service.py
    │   │   └── ai_disclosure.py
    │   └── pipeline/                   ← detection engine
    │       ├── splitter.py             ← 1. split into sentences and claims
    │       ├── rules.py                ← 2. deterministic checks
    │       ├── retriever.py            ← 3. vector search for matching sources
    │       ├── judge.py                ← 4. LLM, strict JSON
    │       ├── verifier.py             ← 5. drop anything unverifiable
    │       ├── scorer.py               ← 6. confidence
    │       └── engine.py               ← runs 1 to 6
    ├── uploads/                        ← private storage (gitignored)
    └── tests/
        ├── test_verifier.py
        ├── test_permissions.py
        └── test_state_transitions.py
```

**Layer rules (backend):** `routers/` stay thin (receive, check role, call a service, return). `schemas/` must match the contract exactly. Real logic lives in `services/` and `pipeline/`.

---

## How we work together

**Ownership**

| Path | Owner |
|---|---|
| `frontend/` | Harshit |
| `backend/` | Ruchir |
| `docs/API.md`, `PROJECT.md` | Both. Changes need the other's approval. |

**Working agreement**

- `main` is protected. All work lands through pull requests, reviewed by the other person.
- Branch names: `backend-<thing>`, `frontend-<thing>`, `docs-<thing>`.
- One small feature per branch, merged within a day or two.
- Sync with `main` at the start of every session.
- Each of us stays in our own folder, which keeps conflicts close to zero.
- **When something merges, say so** and say what the other person can now use ("auth is in main, you can connect login").
- **Contract changes:** message first, then a `docs-api-<change>` PR. Both approve. Both sides update.
- Secrets never reach the repo: `.env`, `.env.local`, API keys, `node_modules/`, `venv/`, `backend/uploads/` are all gitignored.

**Mock-first handshake**

- Backend serves every contract endpoint with fake data from the start. Real logic replaces fakes one endpoint at a time, and the shape never changes.
- Frontend runs on `mockData.ts` or on the live backend, switched by one setting. No screen code changes either way.

**Running locally**

| | Command | URL |
|---|---|---|
| Backend | `cd backend && uvicorn app.main:app --reload --port 8000` | `http://localhost:8000`, interactive docs at `/docs` |
| Frontend | `cd frontend && npm run dev` | `http://localhost:3000` |

`frontend/.env.example`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=true        # true = mock data, false = live backend
```

`backend/.env.example`
```
DATABASE_URL=postgresql://user:password@localhost:5432/greenlight
JWT_SECRET=change-me
ANTHROPIC_API_KEY=your-key-here
ALLOWED_ORIGIN=http://localhost:3000
```

The backend must enable CORS for `http://localhost:3000` in `main.py`.

---

## Version roadmap

Everything starts together, splits into two tracks, meets at checkpoints, and finishes together.

```
v0  Foundation ───────────────────────────────┐  (together)
                                               │
         Backend track          Frontend track │
v1       Mock API               Prototype on api.ts
              └────────── ◆ MEET A ───────────┘  plugged together
v2       Auth + Brand Kit       Login + Brand Kit + Submit
              └────────── ◆ MEET B ───────────┘  real data begins
v3       Detection pipeline     Findings + decisions
              └────────── ◆ MEET C ───────────┘  core flow works end to end
v4       Workflow + Insights    Approvals + Insights + Disclosure
              └────────── ◆ MEET D ───────────┘  feature complete
v5  Finish ───────────────────────────────────  (together) demo ready
```

### v0 · Foundation (together)

Set the ground rules before anyone writes features.

- Repo structure from this document, `.gitignore`, `README.md`, `.env.example` files
- `main` protected, branch and review conventions agreed
- `docs/API.md` agreed and merged (copy of the contract below)
- Empty `frontend/` and `backend/` skeletons that both start and run

**Done when:** both of us can run our side locally and the contract is merged.

### v1 · Two tracks begin

| Backend (Ruchir) | Frontend (Harshit) |
|---|---|
| FastAPI skeleton with CORS and `/docs` | Move current demo data into `mockData.ts` in contract shape |
| **Every** contract endpoint returns fake contract-shaped JSON | Types in `contract.ts` |
| Pydantic schemas written from the contract | All screens read only through `lib/api.ts` |

> **◆ MEET A · Plugged in**
> Harshit sets `NEXT_PUBLIC_USE_MOCK=false`. Every screen loads from the live (fake-data) backend with no code changes. If something breaks, the contract was misread on one side, so fix it here, in the cheapest place.

### v2 · Identity and knowledge

| Backend | Frontend |
|---|---|
| PostgreSQL, models, migrations | Login screen, token handling |
| Login, JWT, role checks on every route | Role-based navigation and visibility |
| Brand Kit: add and list sources, versioning, embeddings | Brand Kit screen (guidelines, facts, terms, assets) on live data |
| Workspace isolation | New-review screen (submit a draft) |

> **◆ MEET B · Real data begins**
> Log in as each role. Add a guideline and a fact in the UI and see them persist. Submit a draft and see it listed.

### v3 · The core: findings

| Backend | Frontend |
|---|---|
| Pipeline: splitter, rules, retriever | Findings page: flagged text, severity, reason |
| Judge (Claude, strict JSON) | Evidence receipt (source ID and version) |
| **Verifier** (quote exists, source ID exists, no unbacked suggestion) | Accept, edit, dispute with reason |
| Scorer, confidence labels | Method badge: rule-based or AI-assisted |
| Rules-only fallback when the LLM is down | Low-confidence labelling, "rules-only" notice |
| `/reviews/{id}/findings`, `PATCH /findings/{id}` | Suggestion preview (optional apply) |

> **◆ MEET C · Core flow works**
> Login → submit draft → real findings with real sources → accept, edit or dispute. This is the demo's backbone. Stop and test it properly before moving on.

### v4 · Workflow and oversight

| Backend | Frontend |
|---|---|
| Review state machine with stored actor, time and reason | Approvals queue and decision screen |
| Comments, approve, request changes (human roles only) | Comments thread on reviews |
| Audit events | Dashboard stats on live data |
| Insights: recurring issues, guideline gaps | Insights and gap views |
| AI disclosure log | AI disclosure panel per review |

> **◆ MEET D · Feature complete**
> A creator submits, resolves findings, a reviewer approves, the audit trail and AI-use record show it, and the dashboard reflects it.

### v5 · Finish (together)

- Tests: verifier, permissions, state transitions; the ~50 draft labelled test set for precision, missed issues and citation validity
- Reliability: timeouts, retries, caching, error and empty states
- Accessibility pass (severity as text + icon + colour; keyboard use; contrast)
- Demo script with fictional brand data only
- README and docs tidy-up, final contract check

**Done when:** one clean run-through of the full flow, nothing hand-faked.

### If time runs short

Cut in this order: visual checks → PDF parsing → insights polish. **Never cut:** the verifier, role enforcement, the audit trail, or human-only approval.

---

## The contract

> Fixed shapes. Backend returns exactly these; frontend expects exactly these. Mirrored in `docs/API.md`.

**Base URL** `http://localhost:8000` · **Format** JSON · **Auth** `Authorization: Bearer <access_token>` on everything except login
**Roles:** `creator`, `manager`, `reviewer`, `brand_admin`
**Review statuses:** `draft`, `scanned`, `resolving`, `in_review`, `approved`, `changes_requested`

### Auth

`POST /auth/login`
```json
// request
{ "email": "harshit@acme.com", "password": "secret" }

// 200
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": { "id": "U-1", "name": "Harshit Verma", "role": "manager", "workspace_id": "W-1" }
}
```

### Brand Kit

`GET /brand-kit/sources?kind=guideline` (`kind`: `guideline`, `fact`, `term`, `asset`; optional)
```json
[{
  "id": "G-4.2",
  "kind": "guideline",
  "title": "Avoid unsupported superlatives",
  "text": "Do not use claims such as '#1', 'best' or 'fastest' unless an approved fact substantiates them.",
  "version": "v3",
  "status": "active"
}]
```

`POST /brand-kit/sources` (brand_admin)
```json
// request
{ "kind": "fact", "title": "Delivery coverage", "text": "Fast delivery is available in select cities." }

// 201
{ "id": "F-12", "kind": "fact", "title": "Delivery coverage",
  "text": "Fast delivery is available in select cities.", "version": "v3", "status": "active" }
```

### Reviews

`GET /reviews`
```json
[{
  "id": "CL-2084",
  "title": "Summer launch announcement",
  "creator": "Aarav Mehta",
  "status": "in_review",
  "finding_count": 3,
  "updated_at": "2026-11-02T10:42:00Z"
}]
```

`POST /reviews`
```json
// request
{ "title": "Summer launch announcement",
  "content": "We offer #1 fastest delivery, guaranteed.",
  "intent_note": "Launch email for the summer campaign" }

// 201
{ "id": "CL-2084", "status": "scanned", "finding_count": 1 }
```

`GET /reviews/{id}`
```json
{
  "id": "CL-2084",
  "title": "Summer launch announcement",
  "content": "We offer #1 fastest delivery, guaranteed.",
  "status": "in_review",
  "creator": "Aarav Mehta",
  "brand_kit_version": "v3",
  "updated_at": "2026-11-02T10:42:00Z"
}
```

`GET /reviews/{id}/findings`
```json
[{
  "finding_id": "F-1042",
  "type": "unsupported_claim",
  "severity": "high",
  "span": { "start": 21, "end": 52, "text": "#1 fastest delivery, guaranteed" },
  "source": { "kind": "guideline", "id": "G-4.2", "version": "v3" },
  "fact_match": null,
  "reason": "No approved fact supports a 'fastest' claim.",
  "confidence": 0.91,
  "method": "ai_assisted",
  "suggestion": { "text": "Fast delivery is available in select cities", "fact_id": "F-12", "applied": false },
  "decision": null
}]
```
- `type`: `unsupported_claim`, `contradicted_claim`, `terminology`, `tone`, `accessibility`, `visual`
- `severity`: `high`, `medium`, `low`
- `method`: `rule_based`, `ai_assisted`
- `decision`: `null` or `{ "action": "accepted|edited|disputed", "reason": "...", "actor": "U-1" }`

`PATCH /findings/{finding_id}`
```json
// request
{ "action": "disputed", "reason": "We hold a third-party award for this claim.", "edited_text": null }

// 200
{ "finding_id": "F-1042",
  "decision": { "action": "disputed", "reason": "We hold a third-party award for this claim.", "actor": "U-1" } }
```

### Workflow

`POST /reviews/{id}/comments`
```json
// request
{ "text": "Please confirm the delivery cities with legal." }

// 201
{ "id": "C-77", "author": "Harshit Verma",
  "text": "Please confirm the delivery cities with legal.", "created_at": "2026-11-02T11:05:00Z" }
```

`POST /reviews/{id}/approve` and `POST /reviews/{id}/request-changes` (reviewer only)
```json
// request
{ "note": "Looks good after edits." }

// 200
{ "id": "CL-2084", "status": "approved" }
```

### Insights and disclosure

`GET /insights/summary`
```json
{ "reviewed_this_month": 128, "needs_attention": 8, "awaiting_approval": 12, "approved_this_month": 94,
  "top_issues": [{ "type": "unsupported_claim", "count": 31 }] }
```

`GET /insights/gaps` (brand_admin)
```json
[{ "source_id": "G-4.2", "title": "Avoid unsupported superlatives",
   "dispute_count": 9, "note": "Often disputed; may be unclear." }]
```

`GET /reviews/{id}/ai-disclosure`
```json
{ "review_id": "CL-2084",
  "steps": [
    { "step": "judge", "used_ai": true, "model": "claude", "data_sent": "1 sentence + 2 matched sources" },
    { "step": "rules", "used_ai": false }
  ] }
```

### Errors (same shape everywhere)

```json
{ "error": { "code": "forbidden", "message": "Only reviewers can approve." } }
```
`unauthorized` 401 · `forbidden` 403 · `not_found` 404 · `validation_error` 422 · `server_error` 500

### Permissions

| Role | Can |
|---|---|
| creator | Submit drafts, view own findings, accept/edit/dispute, comment |
| manager | View team queue, comment, assign, escalate, view insights |
| reviewer | View escalated items with evidence, approve, request changes |
| brand_admin | Manage the Brand Kit, view guideline-gap insights |

The AI has no role. It cannot approve, reject or change content.

---

## Detection pipeline (backend core)

```
draft → 1 split → 2 rules → 3 retrieve → 4 judge → 5 verify → 6 score → findings
```

| Step | What happens | Why |
|---|---|---|
| 1. Split | Sentences and claims; extract headings, alt text, colours | Findings point to exact text |
| 2. Rules | Terminology, contrast, alt text, link text | Exact, fast, no AI needed |
| 3. Retrieve | Top matching rules and facts per sentence (vector search) | Model sees only relevant sources |
| 4. Judge | LLM returns strict JSON: source ID, quoted span, reason, suggestion | No free-form opinions |
| 5. Verify | Code checks the quote and source ID exist, or the finding is dropped | Removes invented flags |
| 6. Score | Confidence from retrieval match, judge certainty, rule type | Low confidence is labelled, not asserted |

**Verifier rules (non-negotiable)**
- The quoted text must exist at the stated position in the draft.
- The source ID must exist in the Brand Kit version used for the review.
- A suggestion may not introduce a claim without an approved fact ID.
- Failing any check drops the finding.
- If the LLM is unavailable, run in rules-only mode and say so.

```python
def verify(finding: dict, draft_text: str, valid_source_ids: set) -> bool:
    s = finding["span"]
    if draft_text[s["start"]:s["end"]] != s["text"]:
        return False        # quote is not really in the draft
    if finding["source"]["id"] not in valid_source_ids:
        return False        # source was invented
    return True
```

| Check | Method |
|---|---|
| Terminology | Rules: dictionary and pattern match |
| Facts and claims | Claim extraction matched to Approved Facts → `unsupported` or `contradicted` |
| Tone and messaging | LLM judged against retrieved voice-guide excerpts |
| Accessibility | Rules: alt text, WCAG contrast, heading order, reading level |
| Visual (basic) | Colour analysis against the approved palette; logo presence |

---

## Frontend conventions

- Screens never call `fetch` directly. Everything goes through `lib/api.ts`.
- `lib/api.ts` switches between `mockData.ts` and the live API on `NEXT_PUBLIC_USE_MOCK`.
- `types/contract.ts` mirrors the contract. If the contract changes, this file changes first.
- Severity is shown with a text label and an icon, never colour alone.
- Everything must be keyboard-usable with sufficient contrast.

| Screen | Endpoints |
|---|---|
| Login | `POST /auth/login` |
| Dashboard | `GET /insights/summary`, `GET /reviews` |
| Brand Kit | `GET` and `POST /brand-kit/sources` |
| Content Reviews | `GET /reviews`, `POST /reviews` |
| Findings | `GET /reviews/{id}`, `GET /reviews/{id}/findings`, `PATCH /findings/{id}` |
| Approvals | `GET /reviews`, `POST /reviews/{id}/approve`, `/request-changes` |
| Insights | `GET /insights/gaps` |
| AI disclosure | `GET /reviews/{id}/ai-disclosure` |

---

## Principles

- **Human in the loop.** Suggestions are optional. Only a human role can move content to Approved.
- **Evidence or silence.** No source, no finding.
- **Traceable.** Every change, comment and decision is stored with actor, time and reason.
- **Private by design.** Workspace-isolated data; embeddings computed on our own server; only the sentence being checked plus its matched sources go to the LLM, never the whole Brand Kit.
- **Disclosed.** Every finding is tagged rule-based or AI-assisted, and an AI-use record is stored per review.
- **Demo data is fictional.** Synthetic brands and content only.

*No measured performance or adoption is claimed. Validation targets (precision, missed issues, citation validity on a labelled test set) are goals for the build, not results.*
