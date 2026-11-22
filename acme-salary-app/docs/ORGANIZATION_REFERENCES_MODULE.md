# Department and designation administration

Approved contract: ADR-003 in [DECISIONS.md](DECISIONS.md), 22 November 2026. This is P4a, not completion of country/currency/FX administration. Salary bands remain deferred.

## API

All operations require a current active HR Manager session. Anonymous reads return 401 and non-HR access returns 403. Mutations require the exact configured Origin plus a session-bound `X-CSRF-Token`; all responses are no-store. Actors are derived from sessions, never request fields. Unknown DTO fields, unknown kinds, invalid UUIDs/pages and invalid names return 400.

`kind` is exactly `departments` or `designations`:

| Operation | Request | Result |
|---|---|---|
| `GET /api/v1/organization-references/:kind?offset=0` | Optional integer offset 0..100000 | `{items:[{id,name,is_active,version}],total}`; 20 rows ordered by name/id, including inactive entries |
| `POST /api/v1/organization-references/:kind` | `{name}` | 201 created `{id,name,is_active:true,version:1}` |
| `PATCH /api/v1/organization-references/:kind/:id` | `{name,isActive,expectedVersion}` | 200 updated row; 409 on missing/stale reference |

Names trim surrounding whitespace and have 1..200 characters at the API boundary. Case-insensitive uniqueness applies across active and inactive names; duplicates return 409. UUID identifiers are immutable. There is no DELETE endpoint. PATCH explicitly supports deactivation/reactivation with the same identifier.

## Database and concurrency

Forward migrations 013/014 add normalized-name constraints, immutable identifiers, version advancement, no-delete/no-truncate protection, transactional before/after audits and private helper functions (013) plus whitespace/length constraints (014). Dirty legacy names cause migration failure with an explicit cleanup-needed message; no existing rows are rewritten or removed.

New employee assignments check department and designation status using `FOR SHARE`, which conflicts with concurrent deactivation updates. Existing immutable assignments remain valid after deactivation. Versioned UPDATE predicates reject competing edits; audit failure rolls back the reference mutation and version. Earlier migration checksums remain intact.

## UI

The HR-only Organization references section supports list switching, pagination, refresh, create, rename, deactivate/reactivate, native confirmation/cancel, loading/empty/error/success states and stale-conflict feedback. Forms preserve the display spelling after trimming. Unsaved edits are never silently merged after conflicts: refresh and reopen the record.

## Verification

`npm run test:references` executes isolated real PostgreSQL cases in a uniquely created synthetic database and drops only that database. `npm run test:login` runs actual SMTP-backed Chromium authentication/team/reference cases. Reference cases use a separate disposable database from authentication/team so their HR fixtures cannot invalidate last-manager scenarios. Diagnostics are retained separately under qa-artifacts/login and qa-artifacts/references. CI includes both commands and existing foundation/database/security gates. Case-level results are recorded in TEST_CASES.md and QA_EXECUTION_REPORT.md after execution; implementation alone is not acceptance.

Remaining work: countries, currency catalogue/precision/lifecycle, FX administration, employee integration and full cross-module permission tests. No production readiness or full salary workflow acceptance is implied.
