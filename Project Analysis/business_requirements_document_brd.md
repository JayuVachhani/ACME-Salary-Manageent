# Business Requirements Document (BRD)
> Current approved precedence (22 November 2026): [DECISIONS.md](../acme-salary-app/docs/DECISIONS.md) supersedes original baseline text: OTP maximum 15 minutes; distinct create/edit rights plus read; separate salary:view/export; no own salary revisions or own permission changes; independent approval for backdated salary. ADR-003 now approves trimmed case-insensitive department/designation names, immutable codes, soft deactivation and referenced-currency precision protection. Salary bands are deferred pending policy approval. Historical option tables below are not current unresolved alternatives for already approved decisions.

> Approved change, 21 November 2026: the addendum at the end supersedes conflicting approval, FX, reporting and retention language in the original baseline.
## ACME Salary Management Platform

| | |
|---|---|
| **Project** | ACME Salary Management Platform |
| **Document Type** | Business Requirements Document (BRD) |
| **Companion Docs** | `requirement_review_scope_baseline.md`, `functional_requirements_document_frd.md`, `statement_of_work_sow.md`, `system_design_document_sdd.md` |

---

## 1. Purpose
Define the business objectives, functional scope, operating rules, and open boundaries for the **ACME Salary Management Platform**—a secure, auditable web application built to manage monthly employee salaries across multiple countries.

## 2. Business Background & Goals
ACME manages monthly compensation for employees operating across multiple countries. Replacing manual spreadsheet tracking with a structured web platform eliminates accidental overwrites, preserves clear cross-country salary history, enforces country-specific monetary rules, and establishes controlled team access.

The platform is engineered as a real operational system and validated using a **10,000-employee synthetic dataset**, with a demo recording produced once development and testing are complete.

### Business Objectives
| ID | Objective |
|---|---|
| BO-01 | Centralize employee records and monthly salary management in a single reliable platform |
| BO-02 | Maintain a complete, non-overwritten history of all salary changes, typo corrections, and cross-country moves |
| BO-03 | Enforce country-specific currency, decimal rounding, and regulatory policies automatically |
| BO-04 | Deliver accurate, pre-filtered compensation reports and cross-currency analytics |
| BO-05 | Secure system access through HR Manager invites, granular permissions, and SMTP email OTP login |
| BO-06 | Prevent conflicting edits and accidental data entry errors through pessimistic locking and save confirmations |
| BO-07 | Provide a tamper-resistant audit trail of who changed or viewed compensation data, available to the HR Manager |

## 3. Scope

### 3.1 In Scope
- **Authentication:** Passwordless login via SMTP email OTP (24-hour validity, maximum 3 attempts, resend support).
- **Team & Role Management:** HR Manager invites team members and assigns permissions (`read`, `write`, `edit`, `delete`); departed users are soft-deleted and treated as new users if re-invited.
- **Country Rules & Regulations Module:** Central configuration of country currencies, decimal rounding precision, policies, and retention rules applied automatically to employees in each country.
- **Employee Management:** Employee creation, profile editing, search, filtering, sorting, pagination, and cross-country transfers.
- **Monthly Salary Management & History:** Monthly base salaries, append-only history timeline and table (`change_type`, `description`, `updated_at`), confirmation prompt on every save, mandatory reason capture with `"Waiting on management approval"` status for changes/typos, and pessimistic edit locking.
- **Multi-Currency Analytics & Reporting:** Country currency defaults, cross-currency compensation with logged conversion details, country-wise rounding, pre-report filters (including salary bands), and CSV export.
- **Reference Data:** The HR Manager maintains country rules, exchange rates, and salary bands; currencies are a fixed ISO 4217 list.
- **Audit Log & Seed Data:** Append-only transactional audit trail, visible to the HR Manager, and a 10,000-record deterministic synthetic seed script.
- **First-User Bootstrap:** A command-line step creates the first HR Manager, since login is invite-only.

### 3.2 Out of Scope
- Downstream management approval action workflows (changes are logged as `"Waiting on management approval"` in history with no approval actions executed in this release).
- External HRMS integrations, mobile native applications, and multi-tenancy.

### 3.3 Open Items (`TBD`)
- **Excel Data Migration (`TBD-01`):** Import format, cleansing, and reconciliation process for existing spreadsheets.
- **Payroll & Extra Compensation (`TBD-02`):** Payslips, deductions, bonuses, and payroll runs (current scope covers monthly base salary only).
- **Deployment & Infrastructure (`TBD-03`):** Hosting, environments, CI/CD pipelines, TLS termination, secrets storage, backups and recovery targets, infrastructure monitoring and alerting, and support SLAs. The application is built to run on any host.
- **Commercials & Sign-Off (`TBD-04`):** Pricing, payment milestones, legal entities, and formal sign-off contacts.
- **Open Decisions:** Five design decisions need client confirmation (OTP validity, meaning of the pending-approval status, self-edit, salary visibility and export, HR Manager rights). They are listed in SDD §11 (`OD-01` to `OD-05`).

## 4. Business Requirements

| ID | Requirement | Priority |
|---|---|---|
| BR-01 | HR users can create, view, search, and maintain employee records assigned to a country, department, and designation | Must |
| BR-02 | A Country Rules & Regulations module manages country policies, rounding rules, and retention settings, applying them automatically to employees belonging to that country | Must |
| BR-03 | All salaries are recorded on a **monthly** basis and prior records are never overwritten | Must |
| BR-04 | Every form save displays an explicit confirmation prompt before committing changes | Must |
| BR-05 | Typo fixes and salary revisions require a written reason and appear in history with status `"Waiting on management approval"` | Must |
| BR-06 | History displays as a clear timeline and table (`change_type`, `description`, `updated_at`) that accurately captures cross-country and currency transitions without breaking | Must |
| BR-07 | Cross-currency salaries and cross-country reports apply explicit conversion rates and date rules, logging conversion details transparently | Must |
| BR-08 | Simultaneous edits to the same record are prevented using pessimistic locking when opened for editing | Must |
| BR-09 | Only the HR Manager can invite team members and grant `read`, `write`, `edit`, or `delete` permissions | Must |
| BR-10 | Departed team members are soft-deleted and treated as brand-new user accounts if they rejoin later | Must |
| BR-11 | Users log in using an SMTP email OTP valid for 24 hours with up to 3 attempts and resend capability | Must |
| BR-12 | Reports and CSV exports require upfront filters (country, department, status, salary bands, dates) before generation | Must |
| BR-13 | Employee and salary records remain stored until explicitly removed per country retention rules | Must |
| BR-14 | Every change to compensation, employees, permissions, rates, and country rules, and every report export and salary-history view, is recorded in an append-only audit trail that only the HR Manager can read | Must |
| BR-15 | The HR Manager maintains exchange rates, salary bands, and country rules; all users with `read` can view them | Must |

## 5. Business Rules

| ID | Business Rule |
|---|---|
| BRL-01 | Employee code and email address must be unique across active employee records |
| BRL-02 | Salary figures represent **monthly** base compensation and must be strictly positive (`> 0`) |
| BRL-03 | Salary records are never overwritten or deleted; every update, including a typo correction, appends a new historical entry that references the entry it corrects |
| BRL-04 | Every create or update action in the UI requires user confirmation before saving |
| BRL-05 | Salary revisions and typo corrections require a reason and enter `"Waiting on management approval"` status in history |
| BRL-06 | Paying an employee in a currency different from their country's default currency requires a logged conversion rate and rate date |
| BRL-07 | Monetary rounding and decimal places are governed by the employee's assigned country rules |
| BRL-08 | Opening a record for editing places a pessimistic lock on that record until saved, closed, or timed out after 15 minutes without activity; other users are blocked, not queued, and every write is additionally protected by a version check |
| BRL-09 | Actions are permitted strictly by assigned role permissions (`read`, `write`, `edit`, `delete`); users with `write`/`edit` access may modify records without self-edit restrictions (subject to Open Decision `OD-03`) |
| BRL-10 | Email OTPs expire after 24 hours (client-stated value, see Open Decision `OD-01`), invalidate after 3 failed attempts, and invalidate previous codes upon resend |
| BRL-11 | Records are retained until explicitly removed |
| BRL-12 | The salary in force is the latest uncorrected salary record effective on or before today; a record awaiting management approval counts as in force and is flagged (Open Decision `OD-02`) |
| BRL-13 | Cross-currency conversion uses the latest exchange rate on or before the rate date within a staleness limit, resolved directly, by inverse, or through USD; a missing rate blocks the operation |
| BRL-14 | Every business date ("today", default report date) is the UTC date; a country transfer adds a new salary row on the transfer date so the current salary follows the new country's rounding rules |

## 6. Core Business Workflows

1. **Team Invite & OTP Login:** HR Manager invites a colleague and assigns permissions → Colleague requests an OTP via email → Enters OTP (within 24h, max 3 tries) → Gains access based on assigned permissions.
2. **Country Policy Configuration:** HR Manager configures country currency, decimal rounding, and policy notes → Employees assigned to that country automatically follow those rules.
3. **Monthly Salary Update / Typo Fix:** Authorized user opens record (pessimistic lock acquired) → Enters updated monthly salary or typo correction + reason → Confirms details in confirmation modal → Saved to ledger and history with status `"Waiting on management approval"` → Lock released.
4. **Cross-Country Relocation:** Employee transfers to a new country → Country and currency updates are logged with conversion metadata → History timeline displays the cross-country and currency transition clearly.
5. **Filtered Analytics & CSV Export:** User selects filters (country, department, salary band, date range, target currency) → Views converted and country-rounded metrics → Exports filtered CSV.

## 7. Sign-Off (`TBD`)

| Role | Name | Date | Signature |
|---|---|---|---|
| Business Sponsor | TBD | | |
| HR Manager | TBD | | |
| Technical Lead | TBD | | |

## 8. Approved change — backdated approval and data protection

The client approved a minimal HR Manager approve/reject workflow for **all backdated salary changes**. Backdated means an effective date before the application's UTC business date. A different active HR Manager must decide; requester and salary subject cannot approve. Requests require a reason; decisions record comments, actors and timestamps. Pending/rejected requests leave the original salary unchanged and are excluded from all pay calculations and reports. Approval appends the new salary at its original effective date. Duplicate pending requests for the same employee/date are prohibited. Rejections remain auditable and can be followed by a new corrected request.

This supersedes BRL-12 and the exclusion of approval actions only for backdated changes. Non-backdated revisions retain the existing immediate-effect/pending-badge baseline; broader approval remains excluded. Future/backdated changes cannot precede joining date, and ordinary same-date collisions are rejected; same-date typo correction chains remain supported.

HR-managed FX maintains immutable historical rate revisions (value, effective date, source, responsible user). No per-entry overrides. Historical reports use applicable historical rates; previously generated snapshots retain exact conversion provenance. Inputs beyond country salary precision are rejected. Report snapshots last 30 minutes, recheck current permissions on every access/export, and are invalidated by relevant permission changes or employee removal. Retention holds block removal/deletion. Country-specific legal policies still require actual approved policy definitions.

Traceability: `acme-salary-app/docs/DECISIONS.md`, ADR-002.

## Approved decision addendum — ADR-005 (22 November 2026)

Client approval supersedes conflicting baseline account-linkage and initial-salary rules. Independent HR links an existing employee/account with a reason and confirmation; one active account per employee; no self-linking or unauthorized relinking. Backend/database must audit actor,time,reason,old/new employee details and invalidate affected sessions/relevant snapshots. Unlinked accounts cannot modify/approve salaries. Initial salaries remain Pending Approval (including past effective dates) until a different authorized HR approves; preserve original effective date and creator/approver/reason/approval timestamp. Creator cannot approve their own entry. Employee creation must atomically save the pending request,not a finalized salary. See [canonical decisions](../acme-salary-app/docs/DECISIONS.md#adr-005--verified-employee-linkage-and-initial-salary-approval). Approval is not an implementation claim; P5a directory is read-only,linkage/creation need reviewed schema/service/UI/tests next.
