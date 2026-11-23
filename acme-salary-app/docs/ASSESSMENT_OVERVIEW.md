# Assessment overview

The later [engineering/security assessment](ENGINEERING_SECURITY_ASSESSMENT.md) records fresh local verification, nine adversarial regression groups, open readiness/performance findings and deployment-specific limits. The published-head evidence below remains historical; subsequent publication and exact-head CI status are recorded in [the Git ledger](../../GIT_CHANGELOG.md).

ACME manages effective-dated monthly salaries and a bounded India/INR payroll workflow. The strongest evidence is financial correctness and understandable recovery: salary history is immutable, initial/backdated requests need independent approval, payroll sources are snapshotted, stale reviews are rejected, and ambiguous retries do not create duplicate writes.

Current baseline: payroll PR #16 and performance PR #17 are merged into main; the latter merge is `e341025`. This overview documents that delivered scope, not a complete production payroll system. The six assessment criteria have supporting evidence; they are not a certification of every requirement or legal correctness.

## Evidence by criterion

| Criterion | Concrete evidence | Where to inspect |
| --- | --- | --- |
| Structured problem solving | Original requirements remain identifiable; decision addenda resolve initial/backdated approvals, linkage, configurable policies and payment scope. Delivered and blocked work are distinguished. | [Decisions](DECISIONS.md), [traceability](REQUIREMENT_TRACEABILITY.md), [development plan](../../DEVELOPMENT_PLAN.md) |
| Architecture and design | Independent Vite/React and Nest projects; feature modules, native injected providers, thin controllers, one DTO pipeline, shared transport/errors and RTK Query server state. Financial transactions retain authorization through the write. | [Technical decisions](TECHNICAL_DECISIONS.md), [Nest composition](../../backend/src/app.module.ts), [React composition](../../frontend/src/app/workspace.tsx) |
| Maintainability | Reusable fields, dialogs, tables and pagination; local edit drafts; exact decimal strings; strict TypeScript; package-owned lint/format/build commands; hook and CI enforcement. | [Shared UI](../../frontend/src/shared/ui), [API boundary](../../frontend/src/shared/api/base-api.ts), [quality tooling](../../tools/quality/README.md) |
| Meaningful tests | Real SQL/Nest HTTP tests exercise permissions, leases, replay, exact proration/caps, independent reviews, stale sources, duplicate finalization, escaping and immutable snapshots. Actual Chromium exercises the rendered workflows. | [Financial regressions](../../backend/scripts/test-payroll-workflow.mjs), [browser suite](../../qa/e2e-auth/payroll.spec.ts), [QA evidence](../QA_EXECUTION_REPORT.md) |
| Intentional AI use | AI assisted implementation, refactoring and test authoring. Business choices and merge decisions came from the user. Generated output was checked with real tools; errors in application code and in generated tests were corrected. Automated review is not independent human approval. | [AI-use account and examples](DEVELOPMENT_LOG.md#ai-use-account--assessment-reconciliation) |
| Product thinking | Searchable salary workspace; employee details in a modal; preview/confirmation before financial changes; grouped payroll steps; partial batch results; retained drafts after conflicts; finalization separated from payment. | [Salary contract](SALARY_MODULE.md), [run workflow](PAYROLL_RUNS_MODULE.md), [delivery contract](PAYROLL_DELIVERY_MODULE.md), walkthrough below |

## Important choices and tradeoffs

- **Independent applications:** frontend/backend install and build separately. This satisfies clear package ownership at the cost of some duplicated tooling configuration. QA and Git orchestration are optional independent packages, not a root framework build system.
- **Modular monolith:** capability modules and database transactions keep authorization, version checks, history and audit atomic. Microservices/queues were not added without an evidenced need. Bounded payroll processing is synchronous; it is not an unlimited bulk job engine.
- **Immutable financial history:** corrections append rather than overwrite. More rows and explicit correction chains preserve attribution. Initial salaries always need independent approval; today's/future ordinary revisions count when effective with a management-review badge. That badge is distinct from payroll-run approval.
- **Explicit payroll policy:** no statutory rates are guessed. Another linked HR approves settings and named responsibilities before calculation. PF/ESI configuration and manually supplied PT/TDS/eligibility remain operator responsibilities; calculated output is not a legal-compliance opinion.
- **Bounded bulk operations:** CSV intake and runs cap at 100 employees. Per-employee salary imports can partially complete and report each result; the UI does not pretend they are all-or-nothing. Company size and simultaneous users are different capacity questions.
- **Measurement before optimization:** EXPLAIN and HTTP timing identified repeated eligibility work in draft listing. The query was narrowed; the actual before/after results and missed targets were retained instead of increasing timeouts or redefining success.

## Verification and limits

At the published payroll/performance heads:15 frontend units, 27 backend units, 7 checksum regressions, 7 new financial integration groups and 44 delivered Chromium cases passed, alongside native lint/types/build/architecture and existing database suites. These counts describe different test layers and are not added together as a single comparable total. PR #17 CI run 45195679366 passed on `d18bd57`; these documentation edits have no new application-test result.

The isolated10k experiment prepared10, 000 employees in 100 runs in89.38seconds and completed automated review/finalization in635.05seconds without unexpected HTTP failures. Draft-list p95 improved from 1, 030.42ms to486.07ms in a read recheck. Finalized-payslip baseline p95 remained1, 124.41ms against a1second engineering target; a concurrent search scenario also missed its target. Shared-host variability, one salary row per employee and limited repetitions restrict the conclusion. [Full results and limitations](PERFORMANCE_10K.md).

Still outside acceptance: production deployment/security operations, statutory/legal validation, automatic TDS assessment, bank transfers, partial payments/reversals/supplemental runs, 15k/long-soak qualification and broader unmet reporting/transfer/band requirements. Earlier14 failed/45 blocked requirement checks remain historical evidence; the delivered-suite passes do not reclassify those cases.

## Focused demo walkthrough

Suggested duration: 10–15minutes, depending on setup. This is a demonstration plan, not a newly executed test.

**Prepare:** follow the [root runbook](../../README.md). Use only synthetic employees. On this configured machine, Mailpit captures OTP emails. Use separate browser profiles for independent accounts. Demo HR1/HR2 are already linked; further Finance/Director responsibilities must be explicitly configured under an approved synthetic policy. Choose an employee outside the reviewers' own linked records. No statutory values should be invented for the demonstration.

1. **Find salary, not implementation details.** Open Salary workspace, search `DEMO-00005`, show current/scheduled compensation, then open Salary & history in the employee modal. Explain pending requests versus active salary.
2. **Make a deliberate financial change.** Enter a synthetic revision/reason, review exact before/after values and effective date, then confirm. Show retained history. Use a past date and another linked HR to demonstrate independent approval; do not confuse it with the ordinary management-review badge.
3. **Show safe bulk work.** Download a CSV template and import a small synthetic batch. Review rows and partial outcomes. Demonstrate a missing employee code as visible feedback; do not retry a saved row with a new command merely to force another result.
4. **Explain policy ownership.** Show a saved inactive policy and its complete settings/approvers. Its creator cannot approve it. Another linked HR activates it. If a reviewed synthetic policy is unavailable, demonstrate the blocked state rather than pretending payroll can calculate safely.
5. **Calculate and review.** Select a manual draft/month and approved policy. Enter eligibility/state/PT/TDS/leave explicitly. Show exact gross, net, employer contributions and dated proration segments. Point out that configured statutory outputs replace the raw manual draft entries.
6. **Separate review from payment.** Prepare a small run and complete its distinct assigned review stages. Show immutable finalized payslip/download and provider-neutral payment manifest. Only the actual assigned Finance approver can attest an externally made payment. ACME does not send money.
7. **Finish with evidence and limits.** Open the regression suite and performance report. Explain one bug caught by tests and the remaining payslip p95 miss. Do not claim that a green CI badge proves statutory compliance or production capacity.

For an independent assessor who cannot reproduce the machine-local setup, use the fresh-clone runbook and synthetic fixtures in a disposable database. Private `.env`, OTP/session values, real employee data and runtime artifacts are not submission materials.
