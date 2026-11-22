# Development progress

Last updated: 22 November 2026. Authoritative roadmap: `../../DEVELOPMENT_PLAN.md`.

Current checkpoint: PR #9 merged at `1e0e65f`. On `feature/backend-linkage`, ADR-005 verified linkage backend adds migration 019 and confirmed independent-HR team linkage with session/OTP/lease revocation and snapshot invalidation. Initial salary/employee writes and other approved backend modules remain pending; unresolved report/band/transfer definitions stay blocked per client direction. Current evidence and PR disposition are in the QA report and Git ledger. Historical chronology below does not override this status.

PR #1 merged by the user: GitHub MCP confirmed merge commit `0a5cac1c4e83201be95ffb3514ff8018fecaddea` at `2026-11-21T15:44:15Z`. Final pre-merge head `0c8456e` passed GitHub Actions run 44920501262 (18 unit tests, 72 logical PostgreSQL checks and 12 foundation Chromium tests) and received an MCP comment review. The agent did not approve or merge the PR. Local main is synchronized; next module branch is `feature/authentication-team-access`, created from origin/main. No authentication implementation or additional test execution is claimed by this documentation handoff.

The inactive-currency approval fix and migration 006 are included in the merged foundation. Foundation acceptance and future application gaps remain classified in PR_1_SCOPE.md. Full business E2E and production acceptance remain outstanding.

QA update: actual Chromium execution completed. Final result: 12 passed / 14 failed, 0 skipped; 45 additional dependent business E2E scenarios blocked. Fixed and retested label contrast, stalled health loading and external font dependency. Unit suite 18/18 and all five instrumented regression suites pass (76 assertion records). Business E2E is not accepted; see project-root QA_EXECUTION_REPORT.md and BUG_REPORT.md.

| Area | Current status | Evidence / next work |
|---|---|---|
| Plan/decisions | Approved; updated | ADR-002 and all five source-document addenda record client changes |
| Project foundation | Tested internally | React/NestJS builds, config/policy tests, lint, TypeScript and health smoke pass; browser QA pending |
| PostgreSQL foundation | Tested | Five checksummed migrations, local runtime/owner separation, immutable audit/ledger, dated assignments, holds and snapshot invalidation |
| Money/FX domain | Tested internally | Exact money input validation, generated cases, rounding, historical direct/inverse/USD valuation and stale-rate rejection |
| Prisma | Tested internally | Introspection, client generation and runtime restricted-role queries pass; SQL migrations retain unsupported constraints/triggers |
| Backdated salary approvals | Backend/database tested | Request/decision service, atomic ledger/history/audit, pending/rejected exclusion, no self-approval, duplicate/stale handling. API/UI/lease/idempotency integration pending |
| Retention and snapshots | Guard/database tested | Holds block removal; every snapshot read checks current identity/permissions/owner/version/expiry. Generation/export/admin UI pending |
| Authentication/team | Merged in PR #4 | Login plus team invitation/permission/offboarding API and UI implemented. 22 team PostgreSQL checks and 9 auth/team Chromium cases pass, including independent accounts, concurrency, before/after audit, pagination/mobile/axe and delivery failures. See LOGIN_MODULE.md and TEAM_MODULE.md. Employee linkage and full production/security acceptance remain pending |
| Remaining product modules | Not started | FX administration, employee editing, ordinary salary flows, reports, analytics, audit UI and full synthetic seed |
| Production readiness | Not achieved | Infrastructure/legal/migration gates and full security/performance/UAT remain pending |

## Historical foundation verification

`npm run verify:database` passed:

- Five migrations applied/checksummed; repeat migration safe.
- Prisma Client generation passed.
- Lint, TypeScript, 18 unit tests and API/web builds passed.
- 11 identity/audit PostgreSQL checks passed.
- 23 country/FX/retention/snapshot PostgreSQL checks passed.
- 28 approval PostgreSQL checks passed, including parallel requests and fault-injected audit rollback.
- Prisma runtime adapter checks and API health smoke checks passed.
- Approval tests create a unique synthetic database and drop only that database; other fixture suites roll back their synthetic rows.

After this gate, npm audit identified an Effect advisory in Prisma tooling. Scoped override to patched `effect@3.22.1` applied; Prisma generation rechecked successfully and final npm audit reports zero known advisories. This does not replace full application security testing.

## Reference increment — 22 November 2026

PR #4 merged at fa2cbc4867994dcde5e81ba0ee3d5b417d2ac8b8, confirmed through GitHub MCP. ADR-003 approved. P4a department/designation API/UI, migrations 013/014, stale-edit/deactivation/history/audit safeguards implemented; locally verified: 23 reference PostgreSQL checks, 13 SMTP/auth/team/reference Chromium cases and 12 foundation Chromium cases pass; PR #5 merged at 8ae97b3b3a1ec70802fc17ca6b97f205d25e9d3b. Countries/currencies/FX remain pending and salary bands are explicitly deferred. Current results are recorded in QA_EXECUTION_REPORT.md; historical counts above describe their original checkpoints.

## P4b country/currency increment — locally tested; PR #7 open; independent approval pending

ADR-004 approved; migrations 015..017, pinned SIX catalogue, authenticated country/currency APIs and confirmed UI implemented. Final country guard retest passed 27 DB and 3 Chromium cases; existing auth/team/reference/foundation browser groups and database gates also passed. See QA_EXECUTION_REPORT.md. FX administration, verified employee linkage, employee/salary/reporting screens and production readiness remain pending; bands deferred. Dependencies restored from lockfile after missing-module/locked local PG binary issues without resetting existing data.

## P4c FX administration — locally verified, PR delivery pending

PR #7 merged at0e0fb86; country/currency scope completed. FX service/controller/UI and migration018 implement append-only rate correction, audited before/after, reader history, historical direct/inverse/USD lookup and configured staleness. Actual tests/results are recorded in QA reports; no full-system acceptance implied.

P5a lower-level final gate PASS under verified non-superuser acme_app override; existing local .env retained.19 directory DB cases,22 units,72 foundation DB,Prisma/health/lint/types/build pass. Browser retests and intermediate accessibility/locator/native startup failures are recorded explicitly in QA_EXECUTION_REPORT.md; no employee write/linkage/approval completion implied.
