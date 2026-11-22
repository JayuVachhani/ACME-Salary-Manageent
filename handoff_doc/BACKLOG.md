# ACME — prioritized product and engineering backlog

**Purpose:** Give the next agent ordered, evidence-backed work and explicit exclusions.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 0e0fb86 (merged PR #7), plus the P4c FX increment on feature/fx-rate-administration.

## Executive summary

The next implementation work is reference administration followed by employee integration and authenticated compensation workflows. Production readiness is blocked by incomplete business scope and operational decisions. Sources: actual source, approved [development plan](../DEVELOPMENT_PLAN.md), [decisions](../acme-salary-app/docs/DECISIONS.md), QA records and discrepancy inventory in [CONTEXT.md](CONTEXT.md). [ROADMAP.md](ROADMAP.md) owns the feature matrix; this file owns priority/order.

Non-breaking rules: keep approved business decisions and synthetic-only tests; do not replace SQL integrity with Prisma push, trust actor IDs from bodies, remove failed requirement probes, alter applied migrations, silently auto-merge permissions, or deploy to a guessed target.

## A — business/security prerequisites

| ID | Item | Priority | Status | Notes / primary touchpoints |
|---|---|---|---|---|
| A1a | Department/designation administration (P4a) | High | done | Merged PR #5; migrations 013/014, real API/UI, 23 PostgreSQL and 4 reference Chromium cases |
| A1b | Country/currency administration (P4b) | Critical | done | PR #7 merged at0e0fb86; ADR-004, pinned catalogue and country-currency module |
| A1c | Immutable historical FX administration (P4c) | High | done (local scope) | Implemented;23 DB /3 FX Chromium local passes; PR review/CI pending. FX_MODULE.md, migration018, service/controller/UI |
| A2 | Verify and administer employee/user linkage before public salary access | Critical | blocked | Nullable mapping currently permits incomplete self-subject protection; users, policy.ts, employee workflows |
| A3 | Employee create/directory/edit/removal with initial salary atomicity | Critical | not started | Dated assignments, validation, permissions, holds and unique keys; employee schemas/UI/API |
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
