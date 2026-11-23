# Engineering and security assessment — 23 November 2026

## Audit verdict

**Pass with risks for the delivered local application; fail for full production acceptance.** No critical/high exploit was reproduced in the exercised paths. This is a code-assisted local security assessment, not an independent penetration-test certificate or proof that every vulnerability has been excluded.

Baseline: `chore/assessment-documentation`, application commit `e34102566250fd7653c5ea573a6a00798d11518c` (merged PR #17). Existing documentation edits were preserved. This increment adds an adversarial regression script, an npm command and a CI step; it does not change application behavior, database schema, financial policies or authentication thresholds. The assessment recorded local evidence before publication; subsequent commit, push, PR and exact-head CI status are recorded in [the Git ledger](../../GIT_CHANGELOG.md).

Observed architecture: independent Vite/React and Nest CLI applications form a modular monolith with capability modules, injected services, shared PostgreSQL transactions and immutable financial history. React uses feature boundaries, reusable controls, one transport and RTK Query for server state. Folder organization is sound; this does not establish that every service has ideal responsibilities.

## Scope, safety and method

- Static gates cover the application source. Manual tracing sampled bootstrap, global validation/errors, authentication/session/rate limiting, employee editing/linkage, salary preparation, policy activation, calculation, review/finalization and document/payment preparation. This is not a claim that every source line received equal manual review.
- Dynamic checks use actual compiled Nest HTTP, restricted database credentials, real PostgreSQL and Chromium. Synthetic fixtures live in randomly named disposable databases on the preserved test server, port 55432. Installed PostgreSQL/acme_app on port 5432 and existing employee data were not used for these checks.
- New HTTP cases obtain fixture sessions through the real authentication provider; SMTP/browser sign-in is separately exercised by the delivered Chromium suites. They do not pretend to be a black-box email penetration test.
- Bounded malformed/oversized requests and six concurrent identical commands were used. No uncontrolled denial-of-service, password/OTP brute force, external target scanning or actual payments were attempted.
- Authorization/session/CSRF lanes were informed by the [OWASP Web Security Testing Guide](https://wstg.owasp.org/stable/4-Web_Application_Security_Testing/). This assessment does not claim complete WSTG coverage.

## Quality gates and evidence

| Gate | Result | Command / scope |
| --- | --- | --- |
| Backend formatting, lint and strict TypeScript | PASS | `npm --prefix backend run format:check`, `lint`, `typecheck` |
| Frontend formatting, lint and strict TypeScript | PASS | `npm --prefix frontend run format:check`, `lint`, `typecheck` |
| Backend units and native build | PASS | `npm --prefix backend test`: 27 tests; `npm --prefix backend run build` |
| Frontend units, native build and boundaries | PASS | `npm --prefix frontend test`: 15 tests; `build`; `test:architecture`: 154 files / 28,075 checks |
| Nest composition and HTTP boundaries | PASS | `backend/scripts/test-architecture.mjs`: real DI, shared providers, module isolation, safe errors/headers, shutdown order, production documentation routes absent |
| Authentication persistence/concurrency | PASS | `backend/scripts/test-authentication.mjs`: attempt persistence, resend, concurrent single use, session/CSRF, current permissions and expiry-after-lock |
| Financial HTTP/SQL integration | PASS | `backend/scripts/test-payroll-workflow.mjs`: seven groups including stale sources, independent stages, duplicate-finalization rollback and immutable exports |
| New adversarial regression | PASS | `backend/scripts/test-security-assessment.mjs`: nine groups; details below |
| Dependency advisory lookup | PASS, limited | `npm audit --json --ignore-scripts --fetch-retries=0` in backend/frontend/qa/tools/quality: zero reported advisories in each response. This does not prove absence of unknown vulnerabilities. |
| 10,000 employee capacity | PARTIAL, historical | Existing [measured report](PERFORMANCE_10K.md); the long benchmark was not rerun for this assessment |
| Full requirements/browser acceptance | NOT PASSED | Earlier 14 failed unmet-requirement checks and 45 blocked workflows remain historical, unresolved evidence; delivered-suite results do not replace them |
| Production ingress, TLS, hosting and recovery | NOT RUN | No deployed production target or restore environment was assessed |

The skill collector's Windows `.cmd` spawning failed with `EINVAL`; direct package lint/type commands supplied the actual evidence. Initial sandbox Vitest starts failed with a Vite `realpath` permission error; authorized reruns outside that restriction passed. Initial sandbox npm advisory requests failed DNS; network-enabled reruns returned valid reports. These environment failures are not counted as test passes.

### Completion evidence

The final nine-group security script passed after adding the spoofed-forwarding-header case. Seven migration checksum regressions passed; no migration was edited. Additional isolated database checks passed: identity/audit 11, country/FX/retention/snapshot 23, approval service 38, team 22, organization references 23, country/currency 27, FX 23, employee directory 19, independent linkage 17 and employee workflow 32. The disposable outer fixture for lower-level scripts was removed after completion; feature scripts removed their own random databases.

Actual Chromium passed all 44 delivered cases: 12 foundation plus 32 authenticated feature cases (login/team 9, references 4, country/currency 3, FX 3, employee workflow 4 and payroll 9). QA formatting/types and four real proxy checks passed. Four disposable Git hook regressions and the synthetic Git safety regression passed. No application source was changed after these runs. Ignored machine-local logs remain under backend/.local and qa/.local; they are not publication materials. This is fresh local evidence, distinct from the earlier published PR checks.

Documentation-only validation resolved 72 current local file/directory/heading links (archived historical links excluded); `git diff --check` passed. These are documentation checks, not additional application tests.

## Finding summary

| Severity | Count | Owner / disposition |
| --- | ---: | --- |
| Critical | 0 confirmed | No reproduced finding in tested scope; no universal security claim |
| High | 0 confirmed | Same limitation |
| Medium | 2 | Runtime/performance: RUN-01 and RUN-02 remain open |
| Low | 0 confirmed | Maintainability candidates are separated below |

### RUN-01 — Medium: readiness never becomes ready

**Owner:** NestJS features/performance. **Evidence:** [HealthService](../../backend/src/health/health.service.ts), lines 7–12, always throws 503/schema_not_verified after a successful database query. The real HTTP architecture/foundation checks confirm this deliberate closed state.

**Impact:** a deployment using `/readyz` as a readiness probe would never route traffic to the application. Liveness does not establish schema compatibility. This is a known implementation gap, not a newly reproduced data breach.

**Remedy:** implement a read-only schema-version/checksum compatibility contract without granting the runtime role migration ownership. Preserve failure on missing/incompatible schema and unavailable database. Do not merely change 503 to 200 or replace readiness with liveness.

**Validation:** isolated matching, missing, modified and unsupported schema fixtures plus database outage/recovery, with production documentation still absent. No readiness/schema permission changes were made in this audit increment.

### RUN-02 — Medium: finalized-payslip latency target remains unqualified

**Owner:** NestJS features/performance. **Evidence:** [performance results](PERFORMANCE_10K.md), finalized-payslip baseline table: p95 1,124.41 ms against the diagnostic 1,000 ms target. Same-account authorization serializes activity; list/detail code also performs per-run queries. These are profiling hypotheses, not proof of the root cause.

**Impact:** the delivered 10k correctness run is not a clean interactive-capacity acceptance. The quiet draft-list recheck does not validate finalized-payslip latency.

**Remedy:** profile and repeat the same finalized-payslip workload on a controlled host, then optimize evidenced query/serialization costs while preserving transactional revocation and permissions. Keep the failed baseline.

**Validation:** repeated comparable p95/p99/throughput/error/lock/pool measurements, exact response equivalence and authorization/concurrency regressions. No timeout increase or relaxed lock was used to hide the miss. Long ledgers, 15k and soak/failover remain unqualified.

## Needs verification and deployment decisions

1. **Shared-IP authentication availability.** [AuthController](../../backend/src/auth/auth.controller.ts), lines 48/65, uses `req.ip`; [rate limiting](../../backend/src/auth/auth-rate.ts), lines 17–29, shares a 20-event/10-minute IP budget across issue/verify and uses one global advisory lock. SECURITY-09 reproduces that 20 requests from one address prevent the next verification, even with a forged forwarded address. This protects against spoofed headers but can block legitimate staff behind one NAT/proxy. Production impact requires the real ingress topology and legitimate login profile. Configure only explicitly trusted ingress addresses and sanitization after that topology is chosen; do not blindly enable `trust proxy=true` or invent higher thresholds. [Express's proxy guidance](https://expressjs.com/en/guide/behind-proxies/) explains the trust boundary. Validate spoof resistance, several legitimate source addresses, shared-NAT behavior and denied-request resource cost before deployment.
2. **Service responsibilities.** [PayrollRunsService](../../backend/src/payroll-runs/payroll-runs.service.ts) owns assignments, source construction/freshness, transitions, persistence and projections; [PayrollCalculationsService](../../backend/src/payroll-calculations/payroll-calculations.service.ts) mixes database loading with decimal calculations. These are credible maintenance seams, not a confirmed architecture failure based on line count. A future focused change can extract a pure calculation model and snapshot/review collaborators while keeping one transaction owner. Do not mechanically add repositories, CQRS or microservices.
3. **React workflow complexity.** The payroll run screen and its hook combine selection, policy loading, review and ambiguous retry state. Feature/API/UI boundaries pass, but scenario expansion should use smaller cohesive step components/hooks. Additional refactoring needs behavior-preserving browser checks; no broad cosmetic restructuring was done here.
4. **Production-only controls.** TLS/certificate/redirect/HSTS behavior at the actual ingress, CSP for hosted frontend assets, proxy/header sanitization, network/DB exposure, secret rotation, least-privilege hosting identities, request/backpressure limits, alerting, backup restore/PITR and failover are not demonstrated by local tests. No backup or runtime credential was exported.
5. **Payroll/legal and product acceptance.** Policy approval is not statutory validation. PT/TDS/eligibility settings remain explicit operator responsibilities. Bank transfers, partial/reversal/supplemental payments and broader reporting/transfer/band requirements are outside delivered acceptance. The current system is not documented as production complete.

## Verified healthy patterns and adversarial cases

The [new repeatable suite](../../backend/scripts/test-security-assessment.mjs), exposed as `npm --prefix backend run test:security`, verifies:

1. Anonymous access rejection and salary permission checks, no-store headers and response credential exclusion.
2. Hostile/null origins, missing CSRF and another session's CSRF cannot create drafts; database count stays unchanged.
3. SQL-like search is literal; sort injection, excessive pagination, privilege/status mass assignment and invalid exact-money formats fail.
4. Six simultaneous identical submissions create one draft/command; changed payload replay conflicts.
5. A nonassigned reader cannot access a guessed payroll run; assigned Finance can read; drafts cannot produce finalized documents or skip approval stages.
6. Revoked sessions and removed salary permissions take effect on the next HTTP request.
7. Malformed JSON returns 400, oversized JSON returns 413, errors omit stack/body contents and liveness survives.
8. The runtime role cannot create tables, update audit rows or delete financial history.
9. Authentication throttling persists and spoofed forwarding headers cannot escape the source-IP budget.

The existing payroll suite independently verifies HTML escaping, spreadsheet-formula neutralization, exact amounts, command replay, source freshness, immutable finalized snapshots, nonself approvals and duplicate-allocation transaction rollback. The new suite supplements that coverage; it does not replace it. CI now invokes the security command after payroll integration. It uses only synthetic local fixtures and rejects a non-test server before opening a database connection.

## Recommended order

1. Implement and verify schema-aware readiness and agree the actual ingress/login-capacity contract before production hosting.
2. Close the measured finalized-payslip performance gap with controlled profiling and retained correctness checks.
3. Complete broader unmet product acceptance, operational recovery and statutory review appropriate to the intended deployment.
4. Extract cohesive calculation/review collaborators when extending those scenarios; preserve module, transaction and permission boundaries.

No discovered critical/high exploit required an emergency application patch. The delivered change strengthens repeatable security verification and CI; it does not pretend the open readiness/performance/deployment gaps have been fixed.
