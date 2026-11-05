# Greenlight

**Pre-publication brand governance.** Submit content, check it against approved brand knowledge, inspect evidence-backed findings, and record a human decision before anything is published.

## Run

```bash
npm install
cp .env.example .env.local   # optional: set NEXT_PUBLIC_API_URL for the FastAPI service
npm run dev                  # http://localhost:3000
npm run typecheck
```
Node 20.9+. On PowerShell use `Copy-Item .env.example .env.local` and `npm.cmd` if `npm.ps1` is blocked.

## 60-second demo script
1. **Overview** → *Run a 30-second demo* (risky copy is preloaded) → *Run brand review*.
2. In the **review workspace**, findings are highlighted inline in the copy. Click one: matched text, why, the approved-source receipt, a suggested fix.
3. *Apply suggestion* → the copy changes, the safety score rises, the audit trail records it. `J` / `K` move between findings.
4. Disposition every finding → **Approve**. Humans decide; the tool never publishes.
5. **Brand Kit** → add a terminology rule (e.g. avoid "Premium") → run another review: it is enforced immediately.
6. **Audit history** → *Export CSV*. `Ctrl/⌘ K` opens the command palette. Settings → *Reset demo data* before each run.

## Structure (feature-based)
```
src/
  app/(workspace)/        Thin route files only: metadata + one feature view each
  config/                 site.ts (brand, user, workspace), navigation.ts
  components/
    ui/                   Design system: Button, Card, Badge, Modal, Tabs, Toast, ScoreRing, Field…
    layout/               AppShell, Sidebar, Topbar, CommandPalette, ThemeToggle
  features/
    reviews/              types · lib/{engine,provider,store,seed,samples,metrics,segments} · components/
    brand-kit/            types · data · store (live source of truth read by the engine) · components/
    dashboard/ approvals/ history/ insights/ transparency/ settings/
  lib/                    cn, format, persistent-store, hooks, theme
```
Rules of the road: pages never contain logic; features never import from each other's `components/`
(only `lib`/`store`/`types`); anything reusable moves to `components/ui`.

## Design system
Tokens live in `src/app/globals.css` (RGB channels per theme) and are exposed in `tailwind.config.ts`
(`bg-surface`, `text-muted`, `border-line`, `bg-brand/10`…). Light and Dark are fully token-driven, so there are
no per-theme overrides. Add a theme by adding one `[data-theme]` block. Status/severity colours come from one
`StatusBadge`; do not hard-code palette colours in features.

## Data layer and the backend seam
- `lib/persistent-store.ts` is the local demo adapter (reviews, Brand Kit, settings, theme). It is not the audit system of record.
- `features/reviews/lib/store.ts` currently powers the UI with local demo persistence. Keep it intact until the backend is available and contract integration can be tested.
- `src/types/contract.ts` mirrors the fixed wire contract in `PROJECT.md`.
- `src/lib/api.ts` is the centralised typed HTTP client for the agreed endpoints. It handles bearer-token attachment, request timeouts, JSON parsing and API errors.
- The current review provider still runs the local deterministic demo engine. Do not set live mode or claim backend integration until the repository adapter is connected and tested against Ruchir's service.

Environment: `NEXT_PUBLIC_API_URL=http://localhost:8000` and `NEXT_PUBLIC_USE_MOCK=true`. The mock switch is documented for the upcoming repository integration; the existing UI remains on its local demo store for now.

**Contract rule:** API paths and wire fields are defined in `PROJECT.md` and must not be renamed or reshaped. Finding evidence must be validated against an approved source ID and version as well as the exact submitted span; quote-substring checking alone is not sufficient. CORS must allow the frontend origin.

## Honest limitations
Local checks are transparent heuristics, not an LLM, and do not prove compliance. Sample analytics (charts, KPIs
marked *sample*) are illustrative. No auth, image/OCR inspection or server persistence yet.

## Principles
Findings cite exact text and a versioned source · no match means "not substantiated", not "false" ·
suggestions never publish · humans own approval · every decision is logged.

## Claim-check regression cases

The local demo engine should flag these as **potentially unsupported claims**, not as proven false statements:

- `We are #1 in the field.` → flags `#1`
- `We are leading the field.` → flags `leading the field`
- `We are the best.` → flags `the best`
- `We are the leading producers of jackets.` → flags `leading producers`
- `We are market leaders.` → flags `market leaders`
- `Our product has a 750 ml capacity.` → no comparative-claim flag

The local rules identify language that needs substantiation. They do not verify market position or factual truth. A reviewer must check the source, scope, date and comparison set.

Approval is blocked while a finding is **Open** or **Accepted** (confirmed but not fixed). A finding must be edited or marked not applicable before approval. This is enforced in the review repository as well as in the UI.


## Review workflow interaction updates

- Full-draft editing now uses an explicit Save draft changes action; Cancel discards unsaved textarea changes. Saved edits are added to the local demo audit timeline.
- Finding-level manual replacement starts with the flagged phrase, not the explanatory suggestion. Saving replaces that phrase in the submitted draft and marks the finding Edited.
- Confirming a finding and marking it not applicable are labelled as distinct human classification decisions.
- Review summary separates Open, Confirmed, Edited, and Approval blockers so the counters agree with the approval gate.
- Approval remains human-controlled and is blocked by Open or Confirmed findings.
