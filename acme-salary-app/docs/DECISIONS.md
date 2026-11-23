# Approved recommendations and unresolved detail

The client approved Section 6 recommendations and fresh development in a new folder on 21 November 2026. This records that approval without inventing answers where Section 6 posed a question without a recommendation.

| Decision | Approved direction / selected engineering detail |
|---|---|
| OD-01 | OTP lifetime 15 minutes (within the approved recommended range); three attempts, single use and resend invalidation. |
| OD-02 | Superseded for backdated salary changes by ADR-002 below. Non-backdated changes retain the baseline immediate effect with a pending badge. Backdated requests require approval before affecting salary selection. |
| OD-03 | Block own salary revisions and own permission changes, including HR users. Verified user/employee linkage required. |
| OD-04 | Separate `salary:view` and `export`. Read alone does not reveal salary values. Country/department access scopes are not silently introduced. |
| OD-05 | Retain HR Manager baseline rights, including invitation of other managers and implicit permissions; self-edit safeguards still apply. |
| ND-01 | Approved document precedence; write=create, edit=modify, delete=soft-remove. Read is additionally required for business modification and export flows; privileges do not silently imply it. |
| ND-02 | Effective-dated country, department and status assignments for historical reporting. Transfer scheduling/backdating limits still require specific rules before transfer implementation. |
| ND-03 | Same-date typo correction chains only; effective-date corrections/cancellations excluded pending a separate approved model. |
| ND-04 | Server-side report snapshots and checked export IDs. Exact expiry, replay access and removal invalidation rules remain open before reports. |
| ND-05 | Snapshot country policy at write time; new policy applies to new ledger writes. No silent historical revaluation. Manual FX overrides and excess precision input policy remain open. |
| ND-06 | No permanent purge. Retention/hold rules and expanded salary-read audit scope remain open; configuration notes are not claimed as legal automation. |
| ND-07 | Missing salaries are counted separately rather than treated as zero; detailed metrics and trend definitions remain open. |
| ND-08 | Controlled department/designation lists. Case-normalized uniqueness and overlapping band policy still require finalization. |
| ND-09 | Responsive keyboard-accessible UI targeting WCAG 2.2 AA. Local test services supplied as Compose configuration; actual runtime access and measurable load profile remain to be established. |
| ND-10 | Core application development authorized. Migration, hosting, recovery and cutover remain separately scoped as in the approved plan. |

Foundation work does not depend on open compensation rules. Resolve remaining details before the affected module, continuing independent work without blocking the whole project. Original source documents remain intact.

## ADR-002 — dated compensation, FX provenance and protected data

Status: approved by client, 21 November 2026. This addendum takes precedence over conflicting earlier text. The client explicitly authorized updating BRD, FRD and SDD for consistency.

- Future and backdated effective dates are allowed on or after joining date. Historical rows are never overwritten. Ordinary revisions/transfers cannot collide on an effective date. Same-date typo correction chains remain the explicit exception.
- All backdated salary changes require a nonempty reason and minimal management approval. Only active HR Managers may submit these requests. Another active HR Manager must approve/reject; neither the requester nor the employee whose salary is involved may approve it. No separate management role is added.
- Pending/rejected requests are stored separately from the authoritative salary ledger and never alter salary calculations, periods or reports. The original salary remains unchanged. Approval appends an entry with the requested effective date; it does not overwrite a previous row. A conflicting or stale request cannot be silently applied.
- Prevent duplicate pending requests per employee/effective date. Rejected requests and decisions remain auditable; a corrected resubmission receives a new ID. Store submitter, decision actor, reason, decision comments and timestamps. Decision comments are required so approve/reject is explainable.
- FX rates are HR-maintained only, with no per-entry overrides. Preserve immutable rate versions containing pair, value, effective date, source, creator and recorded time. Historical valuation resolves rates applicable on or before the report as-of date, subject to approved staleness/path rules, never today's rate simply because the report is generated today. Existing snapshots retain their exact rate revision IDs/provenance.
- Reject salary inputs exceeding the applicable country precision; do not silently round user-entered salary. Rounding still applies to calculated conversion/display aggregates using recorded policy.
- Report snapshots expire after 30 minutes. Revalidate current user status and permissions on every access and export, as well as checking expiry and invalidation. Employee removal or relevant permission changes invalidate affected snapshots. A previously downloaded file cannot be recalled.
- Active retention holds prevent removal/deletion of protected records, including indirect operations. Permanent purge remains excluded. Hold placement/release is HR-controlled and audited; policy-specific minimum retention rules beyond explicit holds remain unconfigured pending actual country policies.
- Notification on approval was present as advice in the pasted conversation, but not in its final approved instruction. A separate SMTP notification workflow is not inferred as required. Decision status must be visible to the requester in the application.

Conflict resolution: the prior SOW/BRD/FRD/SDD exclusion of all approval actions is narrowed. This minimal backdated-only workflow is now included; broad/multi-level approval workflows remain excluded. Implementing approval affects schema, API contracts, permission tests, report selection and UI; estimate must be revisited after the first vertical slice. No new cost or delivery date is asserted.

Official toolchain references checked at foundation setup: https://docs.nestjs.com/first-steps and https://vite.dev/guide/. Node 24.15.0 is present. Installed versions are recorded exactly in package manifests and lockfile after dependency resolution.

## ADR-003 — reference administration defaults

Status: explicitly approved by client, 22 November 2026. Applies until a subsequent business decision overrides it.

- Department/designation names trim leading/trailing whitespace, retain display casing and are unique without regard to case. Inactive names remain reserved; deactivation does not create a second identity for the same reference.
- Reference codes/identifiers are immutable once created. Editable display names do not change identity.
- Use soft deactivation, preserve historical references, and reject inactive selections for new records. Reactivation retains the same identifier. No destructive cleanup or automatic replacement of existing data is authorized.
- Currency precision changes are restricted when existing records/transactions reference the currency; historical accuracy takes precedence. Country/currency API integration remains a subsequent increment, not delivered by the organization-reference increment.
- Salary bands are deferred until overlap, validation and conflict-handling policies are formally agreed. Do not infer band rules from this approval.
- Apply the approved rules in API validation, frontend and database constraints where applicable; audit management changes, reject stale edits and maintain documentation with implementation.

Delivery split: P4a departments/designations; P4b country/currency administration and precision/lifecycle enforcement; P4c immutable FX maintenance. Only P4a is implemented in the present increment. ISO catalogue selection and salary-band rules remain open.

## ADR-004 — ISO catalogue and country-policy administration

Status: proposed interpretation approved by client continuation, 22 November 2026. Reconciles FR-REF-01 read-only catalogue with ADR-003 HR administration.

- Pin the official SIX catalogue with publication/source/hash provenance. ISO code/minor-unit facts are read-only through the app; HR controls activation/deactivation. N.A. minor-unit entries are listed but unavailable for salary use.
- Precision corrections require a separately reviewed migration and must reject currencies referenced by existing records. Never silently update existing currency precision or historical policy snapshots on catalogue refresh.
- Country regulatory/retention text remains descriptive notes. Merge notes without deleting existing JSON metadata; explicit holds are enforced separately. No jurisdiction-specific legal automation is claimed.
- Country policy precision/rounding remain FR-CTRY 0..4 and HALF_UP/FLOOR/CEIL, independent of the read-only ISO minor units. Existing history remains unchanged; new writes use the current policy.
- Salary bands stay deferred; FX maintenance remains a separate increment. Catalogue refresh, currency historical retirement and production operational policies require reviewed future changes.

## ADR-005 — verified employee linkage and initial salary approval

Status: explicitly approved by client,22 November2026. Supersedes incomplete earlier linkage/initial-salary language. Implementation is tracked separately from approval.

Only an independent HR Manager may link an account to an existing employee. Every change requires a reason and confirmation; each employee may have only one active account. Self-linking and unauthorized relinking are prohibited. Backend and database must enforce the rules, audit actor/time/reason/old and new employee details, invalidate affected sessions and relevant report snapshots. Unlinked accounts cannot modify or approve salaries. Do not expose salary writes until these safeguards are implemented and tested. Relinking must never be an implicit consequence of email matching.

Initial salary entries remain Pending Approval, including those with a past effective date. A different authorized HR Manager must approve; the creator cannot approve their entry. Preserve the requested effective date; no initial salary is approved/finalized or included in active compensation until approval. Record creator,approver,reason and approval timestamp. Employee creation must atomically persist the employee and its pending initial request, rather than inserting an approved salary ledger row. The existing initial-ledger/date and backdated-only request constraints need reviewed forward migrations before this workflow is exposed.

Historical pre-PR #15 delivery snapshot (superseded by current module/progress records; business rules above remain unchanged): P5a read-only directory/profile merged in PR #9 at `1e0e65f`. Verified linkage backend is implemented on `feature/backend-linkage` with migration 019 and the team employee-link endpoint; see TEAM_MODULE.md. Linkage UI, atomic employee/pending-initial creation and authenticated salary integration remain pending. No salary mutation endpoint is exposed yet. The client requested full backend scope on 22 November 2026 and explicitly directed unresolved features to stay blocked; no new salary/report/band rules were authorized.

## ADR-006 — manual India payroll drafts and bounded salary CSV revisions

23 November 2026: explicit feature instructions extend earlier excluded payroll scope only to manually entered draft components and draft payslips. India/INR, calendar-month periods and planned payment on the following month's 7th are the initial draft configuration. Components and unavailable automation are specified in PAYROLL_DRAFTS_MODULE.md. No statutory rates/applicability, automatic totals, proration engine, approval roles/lifecycle, finalization or payment processing is authorized as delivered functionality. Proposed proration/review rules await approved implementation policy.

Bounded CSV salary revisions reuse existing per-employee leases, validation, preview, effective dates, independent approval and immutable history. Each employee is its own transaction, with explicit partial results and exact retries. There is no new percentage-increase, reconciliation, payroll calculation or all-or-nothing bulk rule. See SALARY_MODULE.md. Current implementation remains local/uncommitted/unverified; no prior checkpoint pass validates it.
