# ACME — prioritized product and engineering backlog

## Publication verification — 22 November 2026

Required local publication checks passed on this React branch: lint, workspace typechecks/builds, 31 unit tests, QA typing, architecture gate (71 source files / 7,549 assertions), isolated PostgreSQL integrity/authorization/concurrency suites, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The initial reference run exposed a startup identity/OTP race; fresh post-login identity retrieval now cancels and settles the older anonymous query, with a regression test. A later cold login request stalled; the complete 22-case serial rerun passed without relaxed timeouts or authorization checks. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md. No self-approval, merge or production deployment; broader unmet/blocked requirements remain open.

Setup history: incomplete dependencies and a Windows PostgreSQL DLL lock required a clean dependency reinstall and preserved local-instance restart; Prisma was regenerated. An overlapping disposable-database migration hit shared-role contention and the database suites passed serially. No existing database was reset. Historical deferred-check snapshots below do not describe this publication checkpoint.

## Earlier checkpoint records

Current React audit remediation (22 November 2026): shared controls/tables/pagination/request states, employee dependency invalidation, typed notification feedback and accurate delivered-scope copy implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

Rules alignment in progress (22 November 2026): frontend global state now uses Redux Toolkit 2.15.0 / React Redux 9.3.1 and one RTK Query API/cache. Feature-owned endpoints replace custom remote-state effects; server identity is read through useSession from the query cache. Session Context and useResource are removed. Forms, confirmation snapshots and OTP inputs stay local; OTP credentials bypass Redux actions/cache through the same shared secure transport. AppProviders owns store/error-boundary/notification composition; the authenticated workspace is lazy loaded with Suspense. Logout/self-removal/established-session 401 clears cached protected data; 403 refreshes current identity. No API/schema/financial rule changes. **Uncommitted and unverified: no tests, lint, typechecks, builds, safety scans or browser checks were run for this increment, at the user's request.** Existing PR #12 checks cover its published head only; PR #11 backend and PR #10 linkage remain separate pending work.

**Purpose:** Give the next agent ordered, evidence-backed work and explicit exclusions.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

Reference administration is merged. Current work is the read-only employee directory; next are verified linkage,employee creation with pending initial salary,and authenticated compensation workflows. Production readiness is blocked by incomplete business scope and operational decisions. Sources: actual source, approved [development plan](../DEVELOPMENT_PLAN.md), [decisions](../acme-salary-app/docs/DECISIONS.md), QA records and discrepancy inventory in [CONTEXT.md](CONTEXT.md). [ROADMAP.md](ROADMAP.md) owns the feature matrix; this file owns priority/order.

Non-breaking rules: keep approved business decisions and synthetic-only tests; do not replace SQL integrity with Prisma push, trust actor IDs from bodies, remove failed requirement probes, alter applied migrations, silently auto-merge permissions, or deploy to a guessed target.

## A — business/security prerequisites

| ID | Item | Priority | Status | Notes / primary touchpoints |
|---|---|---|---|---|
| A1a | Department/designation administration (P4a) | High | done | Merged PR #5; migrations 013/014, real API/UI, 23 PostgreSQL and 4 reference Chromium cases |
| A1b | Country/currency administration (P4b) | Critical | done | PR #7 merged at0e0fb86; ADR-004, pinned catalogue and country-currency module |
| A1c | Immutable historical FX administration (P4c) | High | done | Implemented;23 DB /3 FX Chromium and final-head CI passed; Merged PR #8 at2a3ee19. FX_MODULE.md, migration018, service/controller/UI |
| A2 | Verify and administer employee/user linkage before public salary access | Critical | blocked | ADR-005 independent HR/reason/confirmation/session revocation approved,implementation pending; nullable mapping still permits incomplete self-subject protection; users, policy.ts, employee workflows |
| A3 | Employee create/directory/edit/removal with initial salary atomicity | Critical | stub/partial | P5a directory/profile locally verified19 DB /3 Chromium; PR pending. Dated assignments, validation, permissions, holds and unique keys; employee schemas/UI/API |
| A4 | Expose backdated request/independent decision workflow safely | Critical | blocked | Depends on A2/A3; SalaryApprovalService, trusted session boundary, approver/requester browser accounts |
| A5 | Ordinary salary/corrections/transfer and operational edit leases | High | stub/partial | Existing schemas are not complete workflow; clarify affected unresolved rules, record_locks, history |

## B — reporting and qualification

| ID | Item | Priority | Status | Notes / primary touchpoints |
|---|---|---|---|---|
| B1 | Historical report generator/preview/export with complete snapshot membership | High | not started | report-access.ts; owner/version/30-minute invalidation; FX provenance and CSV hardening |
| B2 | Resolve aggregate rounding and wire FX staleness config | High | stub/partial | FX HTTP staleness now wired; sumConverted still hardcodes HALF_UP and future salary/report constructors need config |
| B3 | HR audit browsing and metrics/dashboard | High | not started | Immutable tables exist; no read API/UI |
| B4 | Deterministic 10k/15k synthetic data and full action/load/security matrix | High | not started | Replace missing-module blockers only with executed workflows, never synthetic pass labels |
| B5 | Define readiness, hosting/TLS/proxy/secrets/backup/restore/compliance/UAT | Critical | blocked | No deploy implementation or approved target; main.ts /readyz, DEPLOYMENT.md |
| B6 | Decide durable mail, rate-event retention and scale/operational sizing | Medium | deferred | In-memory delivery can be lost; auth_rate_events has no cleanup; ORCHESTRATION.md |

## D — top five documentation hygiene tasks

| ID | Item | Priority | Status | Notes / primary touchpoints |
|---|---|---|---|---|
| D1 | Reconcile legacy 24-hour OTP/self-edit prose with approved addenda | High | stub/partial | Precedence banners now link approved decisions; original historical paragraphs remain.  Project Analysis FRD/SDD/BRD and DECISIONS.md; do not change implementation to old text |
| D2 | Reconcile latest PR #4/#5 merge labels | Medium | done | Latest roadmap/progress/ledger and this pack reflect merged P4a; earlier checkpoints remain historical |
| D3 | Document/fix setup template and launcher/Compose role-port mismatch | High | stub/partial | .env.example missing owner URL; current README explains actual safe path; code change needs a separate approved task |
| D4 | Maintain route/env/schema coverage checks with future feature PRs | Medium | not started | This pack's VALIDATION_REPORT baseline; optionally adopt an automated docs gate after approval |
| D5 | Keep QA history scoped by run and distinguish deployment readiness | Medium | stub/partial | QA_EXECUTION_REPORT.md/TEST_CASES.md; 12/14, 2/12, 3/11 and scoped green suites are not interchangeable |

## Explicit exclusions

| Item | Status | Rationale |
|---|---|---|
| Full payroll/deductions/payslips | cancelled | Outside approved salary-management baseline, not silently added |
| Permanent purge/destructive history rewrites | cancelled | Conflicts with current append-only/hold/history contract |
| Multilevel/general approval expansion | deferred | Only backdated salary minimal independent approval approved |
| Production cutover/migration/deployment | blocked | Requires separately approved infrastructure/business acceptance |
| LLM/document generation/transcription/storage providers | deferred | No runtime integration or current product contract |
| Demo video/checklist | deferred | Client moved it after development/testing |

## Recommended execution order

1. Finish A1b country/currency and A1c FX contracts using ADR-003; address D1/D3 onboarding discrepancies.
2. Complete/test those reference increments, then A2/A3 employee/user linkage and employee flow.
3. Deliver A4 and A5 with real independent accounts and immutable history verification.
4. Build B1/B2, then B3; validate report reconciliation and CSV/security details.
5. Complete B4/B5 and any approved B6 before operational release.

## When an item ships

Update source requirements/technical decision addenda when semantics change; CONTEXT routes/env, DATA_MODEL, WORKFLOW_RULES, RBAC, README/SMOKE_TESTS, ROADMAP status, this backlog, existing traceability/progress/QA docs and Git ledger in the same PR. Add actual evidence and current-head MCP review/check records. Keep LLM/ORCHESTRATION/SMTP/DEPLOYMENT docs aligned if their boundaries change. A handoff-only task does not authorize application changes. Commit/push only when explicitly authorized by the client, as for this publication.

## Changelog

| Date | Change | Evidence |
|---|---|---|
| 22 November 2026 | Initial handoff backlog derived from checked-out source; no implementation/priority promises inferred beyond approved plan | HEAD 4925ef2, schema/config/controllers/tests and approved decision files |
| 22 November 2026 | P4a merged; inventory refreshed against 8ae97b3; client authorized publishing the 14-file handoff pack | PR #5 merge, ADR-003, controllers/migrations/CI |
