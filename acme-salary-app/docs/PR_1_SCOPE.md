# PR #1 acceptance boundary

This PR is the initial, non-production **application/database foundation**, including internal backdated-approval services. It is not delivery of the complete salary application. The client requested resolution of current-feature findings, PR CI and independent review on 21 November 2026.

## Blocking this foundation PR

| Item | Acceptance evidence required |
|---|---|
| Approval-time currency activity | Service and database guard reject inactive requested currency; shared row lock serializes deactivation with approval. |
| Atomic behavior and concurrency | Real PostgreSQL regressions prove no salary/history/decision/audit/version change after rejection, direct SQL cannot bypass the guard, deactivation already in flight is observed, and rejection remains possible. |
| Existing delivered foundations | Lint, typing, unit/build, migration/privilege/immutability, approval, snapshot, Prisma and health tests pass. |
| Delivered browser foundation | Chromium responsive, accessibility, live connectivity, loading/failure/timeout and console/network regressions pass. |
| Safe PR automation | Read-only token, pinned actions, exact head checkout, no production credentials/data, ephemeral local PostgreSQL, branch prefix enforcement, relevant tests on every PR update. |
| Review and merge controls | Actual code re-reviewed through MCP; no unresolved critical/high findings in delivered scope; check results verified for current head; independent authorized review before merge. No self-approval or merge by the agent for this request. |

Check name: **Foundation integrity** under workflow **ACME PR validation**. Branch-protection required-check configuration must be verified by an authorized repository administrator; adding a workflow does not itself change branch protections. Do not assume absence of a reported check means success.

## Future development, not claims of this PR

| Existing QA gaps | Disposition |
|---|---|
| QA-001/002/008: bootstrap, OTP, sessions, team, guarded domain HTTP routes | Next authentication/team vertical slice. There are no unsecured test-only domain endpoints in this PR. |
| QA-003: employee API/UI, validation, search, confirmations and edit leases | Employee module after authentication. |
| QA-004: salary/history/approval/transfer user journeys | Integrate internal tested services into guarded APIs/UI; not certified as E2E here. |
| QA-005: country/FX administration | Reference-data API/UI vertical slice. |
| QA-006: analytics, report generation, CSV/snapshot export | Reporting/analytics slices; no claim of complete report reconciliation. |
| QA-007: HR audit browsing | Audit UI/API slice; append-only storage already tested. |
| QA-012: full 10k seed, performance/security and full browser permission matrix | System qualification after modules are delivered. |
| Earlier QA-009/010/011 | Previously fixed frontend regressions; foundation Chromium tests continue to enforce them. |

The 14 unmet-requirement tests in `e2e/requirements.spec.ts` and 45 blocked workflow cases remain intact and visible in the original QA reports. PR CI executes `foundation.spec.ts`, the delivered scope, rather than pretending the full suite passes or marking requirement failures as expected/skipped. Run `npm run qa:e2e` to audit the whole application's current readiness; it remains nonzero until future modules are implemented. Foundation CI success never means production readiness.

Six SQL migrations are forward-only and preserve previously applied checksums. Windows CI is deliberate because the existing development database binaries target Windows x64. No production deployment or account secrets are needed. CI initialization generates fresh local-only credentials on each hosted runner and no `.env`/database directory is uploaded.

For this request, leave the PR ready for an independent review once current-scope checks pass. The latest client instruction supersedes the earlier conditional automatic-merge permission: **do not approve your own PR and do not merge it**.
