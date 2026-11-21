# ACME Salary Management — Development Plan

Review date: 21 November 2026 (Asia/Calcutta)  
Status: CORE DEVELOPMENT AUTHORIZED — FOUNDATION VERIFIED; DATABASE MODULE IN PROGRESS  
Implementation progress: foundation and core database/domain safeguards implemented in `acme-salary-app`; backdated approval backend tested. Authenticated API/UI modules are not yet complete.

Approval update (21 November 2026): the client approved Section 6 recommendations and requested fresh development in a new folder. Concrete accepted directions and remaining details are recorded in `acme-salary-app/docs/DECISIONS.md`. The original review findings below remain as the historical baseline; recommendations are approved where stated, while questions with no proposed answer remain open until answered. No additional permission is required to continue the authorized core build.

## 1. Review scope and evidence

All five supplied planning documents were read completely, together with the original requirements blueprint:

| Source | Location | Review role |
|---|---|---|
| Gap Analysis / scope baseline | `Project Analysis/requirement_review_scope_baseline.md` | The supplied file is titled Requirement Review & Scope Baseline; there is no separately named Gap Analysis file. It is treated as the requested fifth document. |
| BRD | `Project Analysis/business_requirements_document_brd.md` | Business outcomes, scope, BR-01–15, BRL-01–14 |
| FRD | `Project Analysis/functional_requirements_document_frd.md` | Functional acceptance requirements and NFR-01–09 |
| SOW | `Project Analysis/statement_of_work_sow.md` | Deliverables D1–D9, exclusions, quality and rollout gates |
| SDD | `Project Analysis/system_design_document_sdd.md` | Proposed architecture, example DDL, API/workflow design, OD-01–05 |
| Original blueprint | `Project Requirement/ACME Salary Management.txt` | Original intent, metrics, stack and earlier roadmap |

The workspace was enumerated, including hidden files. It contains these six documents only. No frontend/backend source, package manifest, lockfile, tests, Prisma schema, migrations, configuration, database connection information, or Git repository was found. `git rev-parse --show-toplevel` confirms that this folder is not a Git repository. No running or external database was inspected: none is identified or connected in the supplied project. Database findings below concern the proposed SDD DDL, not a deployed schema.

Recommended document precedence, requiring approval: the approved decision register and plan govern changes; the five companion documents form the detailed baseline; the original blueprint supplies additional intent only where it does not conflict. Unresolved conflicts remain open rather than being silently resolved by document order. Do not edit the original specifications until decisions are approved.

## 2. Product and scope assessment

The agreed product direction is a single-organization, invite-only application for monthly base compensation across countries. It is not a payroll execution system. It includes employee management, country policy configuration, manual FX maintenance, salary bands, an immutable salary ledger, timeline/table history, edit leases, granular permissions, analytics, filtered CSV reports, and HR-only audit access.

The documents are substantially aligned, but the baseline's statement that only five decisions remain understates the remaining work. The product is ready for planning, not unconditional implementation or production use. Core development can begin only after explicit approval; individual modules also depend on the decisions listed below.

Keep the following boundaries visible:

- TBD-01: Excel migration, cleansing, reconciliation and cutover tooling remain excluded until scoped.
- TBD-02: payroll runs, payslips, taxes, deductions and additional compensation remain excluded.
- TBD-03: deployment, CI/CD, hosting, TLS termination, production secrets, encrypted backups, recovery targets, infrastructure monitoring and support remain excluded until scoped.
- TBD-04: commercials, legal parties, sign-off contacts and agreements remain open.
- Automated management approval, permanent purge, external HRMS integration, native mobile apps and multi-tenancy remain excluded.
- Application completion is distinct from production readiness. The latest request for a production-ready result does not silently authorize or resolve these exclusions.

## 3. Existing architecture and stack assessment

There is no implemented stack to preserve or refactor. The proposed stack is React, TypeScript, Vite, Tailwind and shadcn/ui; NestJS and Prisma; PostgreSQL with raw SQL migrations for database-specific features; SMTP OTP and server-side sessions; Jest, Vitest, Supertest and Playwright; OpenAPI documentation.

Retain the modular monolith. At 10,000–15,000 employees, PostgreSQL transactions, indexes and efficient queries are a sensible starting point. Redis, Kafka, microservices and a separate search service have no demonstrated requirement. The proposed exact decimal strings, country snapshots, app/owner role separation, immutable ledger, request-time authorization, same-origin cookies, real-database tests and layered locking are strong foundations.

Recommended implementation boundaries after approval:

| Boundary | Responsibility |
|---|---|
| `apps/web` | React routes, accessible components, forms, confirmation summaries and module screens |
| `apps/api` | NestJS auth, team, country/reference data, employee, salary, reporting/analytics and audit modules |
| `packages/contracts` | Safe shared API types/client contracts; no direct browser access to database models |
| Database migrations | Prisma models plus reviewed SQL for constraints, indexes, triggers, views and least-privilege grants |
| Test support | Synthetic fixtures, controllable clock, local SMTP capture and real PostgreSQL integration environment |
| Documentation | Requirements traceability, decision records, operations/user guides, AI development log and this progress tracker |

Use module service boundaries and a shared transaction context so salary, employee version, history, audit and lease release commit together. Keep money, FX resolution, salary selection and permission policy in centrally tested domain functions. Do not duplicate calculations in React. Do not hold a database transaction open while a user edits or while sending SMTP. Local tooling is included in application verification; production infrastructure remains separately gated.

Exact runtime/library versions, dependency compatibility and advisories must be checked against official documentation at implementation time and pinned in the lockfile. No packages were installed for this review, and no version compatibility claim is made here.

## 4. Cross-document conflicts and missing business rules

Severity: Critical blocks the relevant design; High blocks the affected module; Medium must be settled before its acceptance. Recommendations below are proposals, not approved behavior.

| ID / severity | Evidence and finding | Proposed resolution / dependency |
|---|---|---|
| C-01 / High | Original blueprint specifies passwords/JWT possibilities, `/api`, mutable salary period closure and an 8–10 day MVP. Companion docs specify OTP sessions, `/api/v1`, append-only derived periods and 7–10 weeks. | Approve companion baseline precedence; remove obsolete behavior from future implementation contracts. |
| C-02 / Critical | FR-AUTH-09 permits create/update with either `write` or `edit`; SDD §4/§5.2 separates `write` creation from `edit` modification. | Approve an action matrix; recommend distinct create and edit rights, with read implied or explicitly required for usable UI flows. |
| C-03 / Critical | FR-SAL-10 allows effective-date changes, but SDD typo corrections must copy the original effective date. No cancellation or date-replacement model exists. | Decide whether date corrections are excluded or introduce explicit immutable supersession/cancellation semantics. Never mutate historical rows. |
| C-04 / Critical | SDD transfer immediately changes `employees.country_code`; reports group by that current value even for historical salary dates. Department/status are also current-only. | Decide whether reports represent historical employment attributes or current organization membership applied to historical pay. Recommend effective-dated employment assignments for historically accurate reports. |
| C-05 / High | BRD mentions date ranges; FRD/SDD define as-of reports. Original blueprint includes medians, trends, distribution and native-currency summaries; current FRD summary is less explicit. | Confirm report catalogue and definitions: point-in-time snapshot versus change/trend date-range reports, headcount denominator, missing salary handling and active/inactive treatment. |
| C-06 / High | FR-REP-02/04 promises identical preview/export with the same filters/date. Employee edits, backdated corrections, FX corrections and band edits can occur between requests. | A date and filters alone cannot guarantee equality. Recommend a permission-checked, expiring server-side report snapshot with a report ID for export; approve lifecycle and invalidation behavior. |
| C-07 / High | BRL-01 refers to active employees; FR-EMP-01 and DDL mean all non-removed employees, including INACTIVE. Code uniqueness is case-sensitive; email is not. | Confirm uniqueness includes inactive employees and define trimmed/case-normalized code behavior. |
| C-08 / High | Country retention policy is text; FR-EMP-06 requires enforcing it. BRD removal wording is broader than SOW's explicit purge exclusion. | Define enforceable soft-removal eligibility, hold/minimum-retention rules and audit access. Permanent purge remains excluded; policy notes alone must not be represented as legal compliance automation. |
| C-09 / High | Country edits must not rewrite historic salary values, yet employees automatically inherit new country rules. | Decide when existing salary snapshots change: recommend new writes only, with any revaluation requiring explicit ledger entries. Distinguish current policy display from historical calculation policy. |
| C-10 / High | Cross-currency entry requires an explicit rate/date; SDD resolves from managed FX. Manual overrides, rate date restrictions and exact amount rounding are unclear. | Confirm override rights, rate source, direction, allowed dates, precision and whether excess decimal input is rejected or rounded after confirmation. Preserve the exact approved basis. |
| C-11 / High | Future/backdated revisions and transfers are not bounded. Immediate country mutation conflicts with future transfer dates; transferring before joining is not explicitly prohibited. | Approve scheduling/backdating rules, joining-date constraints, collision handling, transfer without existing salary and which prior amount to carry at transfer date. |
| C-12 / Medium | Original blueprint models departments/designations as entities; FRD/SDD use free text with no maintenance workflow. | Choose controlled reference lists or deliberately free text. Recommend controlled lists to prevent fragmented reporting. Define casing, rename and deactivation behavior. |
| C-13 / High | User-to-employee mapping is absent; self-edit restrictions in OD-03 cannot be enforced by the supplied model. | Add explicit optional verified account/employee linkage if restrictions are approved; define HR self-permission edits and privileged override policy. |
| C-14 / Medium | Every form save requires confirmation; login, filters and heartbeats are also UI submissions but not record-edit saves. | Confirm confirmation applies to business mutations, including team/reference administration; removals need explicit destructive confirmation. Do not add confirmations to OTP entry, filters or heartbeat. |
| C-15 / High | BO-07 broadly mentions viewed compensation; FR-AUD/SDD enumerate salary-history reads but omit ordinary salary/profile/list reads. | Confirm access-audit scope and volume expectations. At minimum implement the enumerated events; never imply all salary reads are tracked unless agreed. |

## 5. Technical design gaps and improvements

These findings arise from the supplied design; no implementation defects are claimed.

| ID | Gap / risk | Planned improvement and verification |
|---|---|---|
| T-01 | Ledger correction constraints do not enforce same employee, same date, valid country snapshot or correction lineage at database level. | Add cross-row validation with transaction serialization and appropriate triggers/constraints; preserve one terminal row per employee/effective date. Test cross-employee corrections, chains, cycles, duplicates and invalid dates with direct SQL. |
| T-02 | `LEAD` and current indexes alone do not prove every intended period rule; correction date changes could produce duplicate dates and ambiguous selection. | Specify interval semantics (recommend half-open), correction rules and deterministic tie handling before final SQL. Test salary selection at each boundary and against an independent oracle. |
| T-03 | Successful OTP verification may race with another verification, resend, offboarding or invitation expiry. Request flow does not explicitly invalidate older codes. Counters alone do not guarantee one session per code. | Serialize OTP issuance/verification per identity, enforce a single open challenge, atomically consume/create session, recheck user eligibility. Retain failed attempt/security audit commits. Parallel replay must produce one success only. |
| T-04 | CSRF is required on every mutation, but pre-login OTP endpoints have no authenticated session token. SPA refresh also lacks a defined CSRF recovery endpoint. | Define pre-auth origin/CSRF protection, token bootstrap/recovery, cookie scope, trusted proxy handling and enumeration-safe response timing. Test cross-origin login attacks and reload/logout flows. |
| T-05 | Per-email OTP cap still allows targeted denial of service; in-memory IP throttles reset and do not span multiple API instances. | Document the residual limitation and decide per-IP thresholds. Start with explicitly single-instance API assumptions, or use PostgreSQL-backed shared counters if multi-instance operation is required. Unknown-user attempts also need throttling. |
| T-06 | Locks are keyed to user, not edit session; two tabs can share, extend or release each other's lease. Delete-only users cannot acquire an edit lock. | Use an opaque lease token scoped to edit session, checked with user, expiry and employee version. Define lock/permission checks for removal. Avoid dependence on browser-unload delivery; expiry remains fallback. |
| T-07 | Last-HR-Manager checks and bootstrap can race. | Serialize privileged role transitions/bootstrap with database locking; enforce system identity uniqueness and status/deleted timestamp consistency. Test simultaneous demotions/deletions/bootstrap attempts. |
| T-08 | FX rows can be corrected; a snapshot of only final rate/date does not preserve all legs, source revisions, country default currency or inversion details. Inverse rounding at eight decimals can affect thresholds. | Preserve full conversion provenance and country-rule version/default currency. Define intermediate precision once, test staleness for every leg, overflow, inverse/triangulated boundaries and band thresholds. Keep salary entry rates separate from report-date valuation. |
| T-09 | FX and band edits lack optimistic versions; salary band minimum can be negative; currency lifecycle and overlapping band rules are incomplete. | Version mutable reference records, validate nonnegative bounds and decide overlap policy. Prevent removal/deactivation from invalidating historical references. Audit band operations explicitly. |
| T-10 | Owner-role triggers are useful but privileged owners can disable triggers; immutable does not mean administrator-proof. Grants alone do not establish no-DDL behavior. | Separate migration/runtime credentials, restrict schema CREATE and default/PUBLIC privileges, validate grants/functions/views and timeouts using actual app role. Document trusted-operator boundary. Extra tamper-evident storage is a separate decision if required. |
| T-11 | Current view computes UTC date in DB while NFR-09 requests application-computed dates. | Authoritative APIs pass one application-computed UTC date into salary selection. Keep the convenience view explicitly secondary; test UTC midnight boundaries. |
| T-12 | Multi-query reports/streams may observe different snapshots; export audit could succeed while download fails. | Use consistent report generation, snapshot IDs and bounded reads. Audit generated/export-started/completed/failed states with honest row counts; do not claim client receipt from server completion. |
| T-13 | Automatic transaction retry or a client retry can duplicate append-only entries. | Add idempotency keys for financial writes and report generation; retries encompass the transaction only, not external SMTP side effects. Test timeout/retry duplication. |
| T-14 | Seed determinism is contradicted by random UUID defaults, `now()` values and changing report dates. | Fixed IDs, seed, clock/date anchors and stable logical checksums. Seed only isolated synthetic databases; prohibit production seed/reset. Repeat in two fresh databases rather than truncating immutable ledgers. |
| T-15 | NFR latency targets lack load, hardware, measurement boundary and report sample definition. Audit growth and short substring searches may alter performance. | Approve a reproducible load profile, concurrent user count, dataset/history sizes and measurement method. Use EXPLAIN and p95 evidence; 15k capacity is tested separately from the 10k seed deliverable. |
| T-16 | SMTP delivery can fail after commit, or process can stop before sending; no cleanup/storage policy for sessions, OTPs and report snapshots is specified. | Provide capture SMTP for local tests, bounded delivery retries and documented failure behavior without storing plaintext OTPs. Define cleanup schedules separately from immutable business/audit retention. Validate real SMTP with synthetic recipients before acceptance. |

The SDD DDL is a design example, not a migration ready to run unchanged. Final schema review will also check active-currency validation, positive FX snapshots, snapshot enum/range checks, trimmed nonempty reasons, indexes for terminal correction lookup, stable pagination and restrictive foreign-key behavior.

## 6. Approval and decision register

Recommendations APPROVED by the client on 21 November 2026. See `acme-salary-app/docs/DECISIONS.md` for selected values and the remaining concrete details. Questions without a recommendation were not silently answered by that approval. Business sponsor/HR owns compensation and access rules; technical owner validates feasibility; production owner closes operational gates. Named formal sign-off contacts remain TBD.

| Decision | Question and recommendation | Blocks |
|---|---|---|
| OD-01 | Keep 24-hour OTP expiry or shorten it? Recommend 10–15 minutes; preserve three attempts, single use and resend invalidation. | Authentication acceptance |
| OD-02 | Does pending pay take effect immediately? Baseline says yes. Confirm this explicitly. Keeping old pay requires a defined activation path; approval actions remain out of scope unless authorized. | Ledger and analytics |
| OD-03 | Permit self-salary edits? Recommend blocking them using verified user/employee linkage, and preventing self-permission escalation. | Team/employee policy |
| OD-04 | May every reader see all salaries and export? Recommend separate `salary:view` and `export` rights; confirm whether country/department scope restrictions are required. | Permission schema, APIs, UI and reports |
| OD-05 | Can HR Managers create more HR Managers and implicitly hold all rights? Confirm baseline or specify narrower administration. | Team and privilege model |
| ND-01 | Approve companion-document precedence and distinct `write=create`, `edit=modify`, `delete=soft-remove` semantics? Define whether modifying rights imply read. | Shared authorization contract |
| ND-02 | Should as-of reports use historical country/department/status? Recommend effective-dated assignments; approve backdated/future transfer policy and effect on headcount. | Data model, employee transfers, reports |
| ND-03 | Must salary effective dates be correctable? Define allowed fields, cancellation, same-day revisions, future entries and backdating limits. Recommend preserving same-date typo chains until a date-change model is approved. | Salary schema and write rules |
| ND-04 | Approve report snapshots for exact preview/export agreement? Define whether historical results must remain reproducible after corrections, snapshot expiry and behavior after permissions/removals change. | Reporting persistence and exports |
| ND-05 | Confirm FX source/override rights, precision/rounding, rate date rules and country-policy change behavior. | Money engine and reference data |
| ND-06 | Define enforceable soft-removal retention/hold rules and read-audit scope. Is configuration of policy notes sufficient, or are concrete legal rules expected? | Country policy, deletion and audit |
| ND-07 | Confirm dashboard/report metric catalogue, range versus as-of reports, inactive employees and employees with no effective salary. Recommend showing missing salary counts rather than treating missing as zero. | Analytics acceptance |
| ND-08 | Controlled department/designation lists or free text? Confirm uniqueness casing, band overlap rules and currency deactivation rules. | Reference and employee acceptance |
| ND-09 | Confirm local PostgreSQL/SMTP test access, performance load profile, target browser/accessibility standard and named UAT approver. Recommend keyboard-accessible responsive UI targeting WCAG 2.2 AA, subject to agreement. | Tooling, UX and measurable acceptance |
| ND-10 | Is this approval for the scoped core build only, or should migration and production infrastructure be separately scoped now? Production additionally needs countries/policies, hosting/data residency, backup/restore targets, monitoring, SMTP delivery ownership, agreements and release sign-off. | Production work and cutover |

Approve the core plan and resolve OD-01–05 plus schema-changing ND-01–06 before building affected foundations. Remaining ND items must close before their module starts. If partial approval is given, record its exact scope and keep dependent work blocked.

## 7. Module-wise implementation sequence

Each module is delivered as a working vertical slice: persistence, backend validation/authorization, documented API, frontend, audit integration and meaningful tests. Do not defer all security, audit or testing to the final phase.

| Phase / priority | Module and implementation scope | Depends on | Exit evidence | Status |
|---|---|---|---|---|
| P0 / Critical | Approve baseline, decisions, traceability and architecture records; finalize report/permission/date contracts | Client approval | Recommendations approved; remaining detailed rules tracked separately | Approved recommendations; detailed contracts tracked |
| P1 / Critical | Repository/workspaces, pinned toolchain, web/API shells, validated config, redacted logs, health endpoints, local DB/SMTP tooling, verification command and design tokens | P0 | Lint/type-check, 10 tests, API/web builds and health API smoke passed; local PostgreSQL runtime verified | Foundation verified; browser QA pending |
| P2 / Critical | Schema/migrations, restricted roles, system identity, append-only protections, date/money utilities and initial audit service; small deterministic fixtures | P1; ND-01–06 | Five SQL migrations, Prisma generation/adapter, exact-money domain and 62 real PostgreSQL checks passed; full catalogue/band and final schema acceptance pending | Core foundation tested; in progress |
| P3 / Critical | Bootstrap, OTP request/verify/resend, sessions, CSRF, invitations, permissions, team administration and continuity safeguards | P2; OD-01/03/04/05 | Parallel OTP/replay tests, offboarding revocation, full action matrix, login/team E2E and captured SMTP | Not started |
| P4 / High | Country policies, currency list, FX maintenance, bands and approved department/designation model; admin forms and confirmations | P3; ND-05/06/08 | Version conflicts, policy snapshots, FX/rounding and reference access tests; audited mutations | Not started |
| P5 / Critical | Employee create with initial salary, directory/search/filter/sort/pagination, profiles, edit leases, removal and transfer groundwork | P4; ND-02/03/06/08 | Unique constraints, literal search escaping, role checks, two-editor tests, initial-salary rollback and accessible forms | Not started |
| P6 / Critical | Salary revisions, backdated HR approval, correction chains, effective-date selection, country/currency transfers, reasons/pending status, timeline/table and conflict recovery | P5; OD-02/03; ND-02/03/05; ADR-002 | Approval service/database tests pass; authenticated APIs/UI, lease/idempotency and E2E remain pending | Approval domain groundwork tested; vertical slice not complete |
| P7 / High | Shared report query/FX valuation, snapshots, filters, CSV streaming/sanitization and export permissions/auditing | P6; OD-04; ND-04/07 | Preview/export equality under concurrent changes, missing/stale FX rejection, formula-injection and cross-permission tests | Not started |
| P8 / High | Dashboard/analytics, counts/distributions, approved medians/trends and native/converted summaries; searchable HR audit screen | P7; ND-07 | Independent totals/median oracle, report reconciliation, removal/status/date tests and restricted audit access | Not started |
| P9 / High | Full 10k deterministic synthetic seed, 15k load extension, regression/security/accessibility/performance hardening | P3–P8; ND-09 | Stable checksums across fresh DBs, all verification gates green, measured p95 and documented fixes | Not started |
| P10 / High | UAT, user/technical docs, OpenAPI, AI development log, limitations, demo recording and handover | P9 and named approver | D1–D9 checklist signed; synthetic-only walkthrough and reproducible setup | Not started |
| P11 / Separate gate | Production migration/deployment/recovery/monitoring and cutover, only under approved additional scope | Core acceptance; TBD-01/03/04 and legal closure | Restore drill, reconciled migration, TLS/secrets/access checks, monitoring and named release approval | Excluded pending scope |

Dependency path: approved domain contracts → database/audit → identity/access → reference rules → employees/leases → ledger/transfers → reports → analytics → final qualification/handover. Audit backend starts in P2; its user interface completes in P8. Small test fixtures start in P2; the full seed is not postponed until testing can no longer inform the design.

## 8. UI/UX acceptance direction

Use a consistent application shell with Dashboard, Employees, Reports, Country/Reference Settings, Team and Audit navigation governed by approved permissions. Core screens are email/OTP login, searchable employee directory, profile summary, salary editor, timeline/table history, pre-filter report builder, preview/export, and HR administration.

- Design responsive desktop-first layouts with usable smaller-screen views, keyboard navigation, visible focus, labeled controls, readable tables and status text in addition to color.
- Show monthly units, original currency, reporting currency, effective date, rate date/path and pending-pay meaning without ambiguity. Distinguish recorded time from effective business date.
- Confirmation summaries show before/after values and reasons. A country precision mismatch triggers the specified warning. Disable duplicate submissions without treating this as the only idempotency defense.
- Model loading, empty, validation, permission-denied, missing-FX, SMTP failure, stale-version and lost-lock states. Preserve unsaved input on lock loss on screen, without persisting confidential form data to browser storage by default.
- Lock notice displays holder and expiry; conflicts require refresh/review instead of silent overwrite. Recheck server permissions on every action.
- Reports require explicit Apply before generation. Display filter summary, as-of date, rate basis, missing-data warnings and snapshot/export state.
- Prepare low-fidelity screen flows during the approved design phase before implementing the module UI. No UI implementation was produced during this review.

## 9. Test strategy and definition of done

All tests use synthetic employees and isolated databases. No real employee files, addresses or salary values enter development, screenshots or recordings.

| Layer | Required evidence |
|---|---|
| Domain/property tests | Exact decimal operations; 0–4 decimal modes; overflow/positive constraints; FX legs/staleness; bands; date boundaries; correction chains and salary selection |
| PostgreSQL integration | Constraints, partial indexes, views/functions, triggers, app-role grants, rollback on audit failure, fresh/upgrade migrations and soft removal |
| Parallel database/API tests | One lock winner across competing edit sessions, stale version rejection, expired lease takeover, OTP consumption/resend races, last-manager continuity and idempotent retries |
| Permission/security tests | Every endpoint × relevant role/permission combinations, CSRF, revoked sessions, enumeration-safe responses, DTO validation, CSV injection and log/secret redaction |
| Frontend/E2E | Login/invite, directory/profile, confirm/cancel, salary revision/correction, transfer, timeline/table, lock loss, report/export and HR-only audit |
| Reconciliation/performance | Known expected sums/averages/medians and headcounts independent of production query code; reproducible 10k and 15k load results, query plans and p95 targets |
| Final security/UX review | Dependency audit, local ZAP baseline with triage, keyboard/accessibility checks and responsive browser validation |

NFR targets are list/search p95 ≤500 ms and filtered analytics/reports ≤1.5 seconds; their reproducible environment and load profile need ND-09 approval. Do not claim performance based only on row count or unit tests.

A module is done only when its UI, APIs and persistence work together, all mapped requirements have acceptance evidence, permissions/audit/confirmation rules pass, relevant real-database and E2E tests pass, error states are reviewed, documentation is updated and blocking defects are resolved. Run the complete local verification gate before release; record unavailable checks as blocked, never passed.

## 10. Delivery tracking and estimates

Retain the SOW estimate as provisional: 7–8 weeks for two engineers plus QA, or 9–10 weeks for one engineer plus QA. These are staffing-based estimates, not a promise for this chat. The original 8–10 working-day estimate does not cover the detailed current scope. Effective-dated employment, report snapshots or changed approval rules can alter the estimate; re-estimate after decisions and a first completed vertical slice. Migration/infrastructure add-ons need separate estimates and approval.

After every module, update its status, completed scope, requirement IDs, test commands/results, unresolved defects, decisions and next dependency in this file. Maintain detailed implementation evidence in the development log, avoiding secrets or real employee data. Proposed progress states: Not started, In progress, Blocked, Verification, Accepted. Percentage completion must follow accepted deliverables rather than generated code volume.

| Deliverable | Coverage | Current evidence |
|---|---|---|
| D1 baseline | P0 | Six sources reviewed; plan recommendations approved; concrete decision record created |
| D2 code/migrations | P1–P8 | Fresh workspace and identity/audit migration implemented; remaining modules pending |
| D3 authentication/team | P3 | Not started |
| D4 country/reference rules | P4 | Not started |
| D5 employees/ledger/history | P5–P6 | Not started |
| D6 analytics/reports | P7–P8 | Not started |
| D7 synthetic seed | P2 fixtures, P9 full seed | Not started |
| D8 tests/API documentation | Every phase, final P9–P10 | Not started |
| D9 demo | P10 after QA | Not started |

## 11. Review completion and handoff

Completed: full document review, workspace inventory, proposed architecture/schema/API review, cross-document gap register, approval questions, module dependencies, quality gates and delivery tracking.

Not performed: application coding, schema creation, migrations, dependency installation, SMTP sending, deployment or tests of an application. There is no application to execute yet. No external service or production database was accessed for this review.

Historical review handoff: development originally awaited approval. The client has now approved recommendations and authorized the fresh core build. This does not authorize real employee data, production cutover, deferred infrastructure, or unspecified critical business rules.

## 12. Implementation evidence — 21 November 2026

- New application root: `acme-salary-app`. Original five documents and requirements blueprint preserved.
- Node 24.15.0; exact npm dependencies and lockfile recorded. React 19.3.1, Vite 8.3.8 and NestJS 12.6.0 resolved from npm. Official Nest/Vite runtime compatibility documentation checked.
- API/frontend foundation, configuration validation, loopback API, same-origin development proxy, security headers, metadata-only logs and health checks implemented. No fake salary APIs or employee metrics.
- Foundation policy tests enforce separate salary visibility/export, create versus edit, inactive/system account denial and self-salary/self-permission restrictions. These primitives still need integration into future authenticated endpoints.
- Client authorized project-local PostgreSQL. PostgreSQL 17.12 initialized under ignored `.local/postgres`, bound to `127.0.0.1:55432`. Random local credentials and `.env` are ignored; migration owner and restricted runtime roles are separate. No OS service installed.
- Identity/audit migration implements approved permission vocabulary, system identity uniqueness, user status constraints, append-only audit triggers, grants and schema restrictions. Checksummed, serialized migration runner is forward-only and repeat application passed.
- `npm run verify:foundation`: lint, TypeScript, 10 config/policy tests, NestJS build and React production build. Windows sandbox Vite access failure was resolved by running the same build with permitted host access; no code workaround bypasses checks.
- `node --env-file=.env scripts/test-database.mjs`: 11 real PostgreSQL checks passed, including owner/runtime audit mutation/truncate protection, runtime DDL/schema-migration denial and invalid identity constraints.
- `node --env-file=.env scripts/test-health.mjs`: liveness, request ID/security headers, closed readiness and absence of unimplemented data route passed. Readiness deliberately stays 503 until full domain migrations are verified.
- `npm audit --json`: zero known advisories reported after PostgreSQL binary tooling installation. This is dependency evidence, not a full security assessment.
- Still pending: full Prisma/domain schema and money engine, authentication/delivery/session flows, reference/employee/salary/reporting modules, 10k seed, browser/E2E/accessibility, load/security scans and production work. SMTP capture configuration exists; actual SMTP delivery is not yet tested.
- Additional concrete rule proposal sent to the client for transfers, FX override/input precision, report expiry/invalidation and retention holds. Continue independent core work; dependent behavior waits for that answer.

## 13. Approved scope update and latest verification

On 21 November 2026 the client approved the concrete date/FX/precision/snapshot/hold rules, then explicitly approved minimal HR Manager approval for all backdated salary changes. The earlier blanket deferral of approval workflows and immediate effect for pending backdated pay is superseded. Another active HR Manager must decide; requester and salary subject cannot approve. Pending/rejected requests leave the original salary unchanged. Broad multi-level approval remains excluded.

Updated all five companion specifications through clearly marked addenda. Canonical implementation decisions: `acme-salary-app/docs/DECISIONS.md` (ADR-002) and `docs/TECHNICAL_DECISIONS.md`. Requirement mapping, latest progress and limitations are in `docs/REQUIREMENT_TRACEABILITY.md`, `docs/DEVELOPMENT_PROGRESS.md` and `docs/KNOWN_ISSUES.md` under that application root.

Implemented and verified: immutable FX revisions with rate/date/source/actor; historical assignment schema; explicit retention holds/release and removal guards; 30-minute snapshot constraints and fresh access checks; immutable salary/request/decision tables; exact money and historical FX helpers; atomic backdated submit/approve/reject backend service; Prisma schema/client/adapter. A deferred constraint prevents approved decisions committing without their ledger row. Automatic ledger triggers append history/audit and increment employee version. Audit-write failure rolls back the decision and salary together.

`npm run verify:database` passed: 18 unit tests; 11 identity/audit, 23 country/FX/retention/snapshot and 28 approval PostgreSQL checks; Prisma runtime checks; API health smoke; lint/type checks and frontend/backend builds. These are internal/domain results, not completed authenticated feature acceptance. No real employee data was used. Disposable test databases are removed; transactional synthetic fixtures roll back.

Added stable Prisma 7.10.1 and decimal.js. A transitive Prisma tooling advisory was found and remediated via scoped Effect 3.22.1 override; Prisma generation rechecked and final npm audit reports zero known advisories. Full security scans remain pending.

Next: complete database/reference foundations and authentication/team vertical slice, then expose the tested approval domain only behind validated sessions and permissions. Salary/approval UI, reports, full seed, browser/E2E and production readiness remain pending. SOW timing must be re-evaluated for the approved scope extension; no new deadline or commercial estimate is inferred.

## 14. Chromium QA checkpoint — 21 November 2026

Performed actual Playwright Chromium testing on isolated local API/web instances. Initial run: 9 passed / 16 failed (25 tests). Fixed contrast, unbounded health-fetch loading and remote font dependence. Final run: 12 passed / 14 failed (26 tests), 0 skipped. New OTP probe added to the final run. Desktop/mobile screenshots reviewed; current foundation passes four viewport overflow checks and automated accessibility scans after fixes.

Fourteen requirement checks still fail because login/OTP, business navigation/screens and protected API endpoints are missing. Forty-five downstream E2E scenarios are recorded BLOCKED rather than passed. Internal approval data-integrity checks are separate evidence; browser reports and multi-account approval cannot yet be certified. Do not treat this checkpoint as end-to-end application acceptance or production readiness.

Reran all 18 unit tests and five existing real PostgreSQL/service/API suites; 76 individual assertion records pass. Lint, application type-check/build, QA type-check and dependency audit passed. QA automation was added; no production or existing employee data reset occurred.

Reports under `acme-salary-app`: `QA_TEST_PLAN.md`, `TEST_CASES.md`, `QA_EXECUTION_REPORT.md`, `BUG_REPORT.md`. Retained initial/final JSON, HTML, screenshots and traces are under `qa-artifacts`. Next implementation priority remains real authentication/bootstrap/session/team functionality, followed by the approved domain vertical slices. Re-run the explicit unmet-requirement tests as each module becomes usable; do not suppress them to claim success.
