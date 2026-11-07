# Greenlight API integration handoff

This frontend currently remains on its local demo repository. The typed API client is groundwork only; no screen has been switched to live API calls yet.

## Fixed contract

`src/types/contract.ts` mirrors the request/response shapes in `PROJECT.md`.
`src/lib/api.ts` is the only place that should call `fetch` for backend endpoints.

Base URL: `NEXT_PUBLIC_API_URL=http://localhost:8000`
Mock setting: `NEXT_PUBLIC_USE_MOCK=true` until live integration is tested.

## Safe integration sequence

1. Obtain Ruchir's running backend URL and confirm `/docs` is available.
2. Test `POST /auth/login`; confirm token and user role fields.
3. Test `GET /brand-kit/sources` and `POST /reviews` with contract examples.
4. Test `GET /reviews/{id}` and `GET /reviews/{id}/findings`.
5. Verify every finding's `span.start`, `span.end`, and `span.text` against the submitted content, and verify `source.id` plus `source.version` against an approved Brand Kit source. Drop any finding that cannot pass verification.
6. Test `PATCH /findings/{finding_id}` for accepted, edited and disputed decisions.
7. Test reviewer-only approve/request-changes endpoints and confirm backend role enforcement.
8. Test comments, insights and AI disclosure.
9. Only then connect the UI repository to live mode. Keep local demo mode as an explicit fallback, never silently label it as live analysis.

## Current frontend limitations

- Review, Brand Kit and settings data are still persisted locally for the demo.
- `NEXT_PUBLIC_USE_MOCK` is documented but is not yet a runtime switch for the repository.
- The existing UI provider has not yet been replaced by the agreed review workflow endpoints.
- The API client does not implement a refresh-token flow; the agreed contract currently specifies only an access token.

Do not claim full backend integration until the steps above pass against Ruchir's service.
