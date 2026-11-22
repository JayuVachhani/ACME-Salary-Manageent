# ACME Salary Management Platform: Requirement Review & Scope Baseline
> Current approved precedence (22 November 2026): [DECISIONS.md](../acme-salary-app/docs/DECISIONS.md) supersedes original baseline text: OTP maximum 15 minutes; distinct create/edit rights plus read; separate salary:view/export; no own salary revisions or own permission changes; independent approval for backdated salary. ADR-003 now approves trimmed case-insensitive department/designation names, immutable codes, soft deactivation and referenced-currency precision protection. Salary bands are deferred pending policy approval. Historical option tables below are not current unresolved alternatives for already approved decisions.

> Approved change, 21 November 2026: backdated salary changes now require another HR Manager's approve/reject decision and remain outside calculations while pending/rejected. This supersedes the blanket deferred-approval and immediate-effect statements for backdated entries only. Historical FX versions, precision rejection, 30-minute permission-revalidated snapshots and retention holds are confirmed. See ADR-002 in `acme-salary-app/docs/DECISIONS.md` and the BRD/FRD/SDD addenda.

**Project:** ACME Salary Management Platform  
**Document Purpose:** Establishes the verified scope, core architectural rules, confirmed requirements, and explicit `TBD` boundaries prior to development.

---

## 1. System Identity & Engineering Philosophy

- **Real Application, Build-Ready:** Designed and built as a real system for managing monthly employee compensation across countries. Production rollout is gated by closure of the open `TBD` items (see §4).
- **Validation & Demonstration:** Includes a deterministic **10,000-employee synthetic seed dataset** for development, performance testing, and QA. A walkthrough demo video will be recorded once development and testing are complete.
- **Practical Engineering Judgment:** Built as a clean, right-sized modular monolith (React, NestJS, PostgreSQL) that enforces strong data integrity, concurrency safety, and clear history without over-engineering unnecessary distributed infrastructure.

---

## 2. Core Confirmed Functional Pillars

### 2.1 Authentication & Team Access Control
- **SMTP Email OTP Authentication:** Users log in using a One-Time Password (OTP) delivered via SMTP email. Each OTP is valid for **24 hours**, allows up to **3 verification attempts**, and includes a **Resend OTP** option (which invalidates any prior active code). Successful verification immediately consumes the code.
- **HR Manager Invites & Granular Permissions:** Only the **HR Manager** can invite team members and assign permissions (`read`, `write`, `edit`, `delete`).
- **Role-Based Action Enforcement:** System actions are governed strictly by assigned permissions—users with `write` or `edit` permissions can create and modify records without special self-edit blocks.
- **User Offboarding & Re-Onboarding:** Departed team members are **soft-deleted** so historical audit attribution stays intact. If a former member returns, they are invited and treated as a brand-new user account.

### 2.2 Country Rules & Regulations Module
- **Country-Driven Governance:** A dedicated **Country Rules & Regulations module** defines default currency, decimal/rounding precision rules, regulatory policies, and retention settings per country.
- **Automatic Policy Application:** Employees automatically inherit the rules and rounding logic of the country they belong to.
- **Data Retention:** Employee and salary records are retained until explicitly removed in accordance with country policy.

### 2.3 Monthly Salary Ledger, Confirmation & History
- **Monthly Standard:** All salaries represent **monthly** base compensation.
- **Append-Only Ledger (No Overwrites):** Historical salary records are never overwritten or deleted.
- **Mandatory Confirmation & Reason Capture:**
  - Every form save triggers a **confirmation prompt** before committing data.
  - Typo fixes and salary revisions require a **reason** and are recorded in history with the status **`Waiting on management approval`**. Because automated management approval workflows are deferred, no downstream approval actions occur on these items in this release.
- **Timeline & Table History View:** History is presented clearly as both a timeline and table displaying **`change_type`**, **`description`**, **`updated_at`**, old/new values, and explicit **cross-country and currency transitions** so moving an employee across countries never breaks historical clarity.
- **Pessimistic Record Locking:** Opening an employee or salary record for editing locks it for that user. Other users attempting to edit the same record are blocked (with lock holder details, no queue) until the first user saves, cancels, or the lock expires after 15 minutes without activity (a heartbeat keeps it alive while the form is open). A version check on every write guarantees no update is lost even if a lock expires.

### 2.4 Multi-Currency Handling & Filtered Reporting
- **Country Currency & Cross-Currency Exceptions:** Salaries default to the employee's country currency. Paying an employee in a non-local currency is supported when paired with an explicit conversion rate and conversion date, which is logged and visible in history and tracking.
- **Country-Specific Rounding:** All monetary calculations and displays follow the decimal and rounding rules configured for each country.
- **Pre-Report Filters & Currency-Converted Analytics:** Users apply upfront filters (country, department, status, salary bands, dates, target reporting currency) before generating reports or CSV exports. Cross-currency totals and averages use documented conversion rates and date rules rather than raw addition.

---

## 3. Open Scope Items (`TBD`)

The following items are intentionally left **`TBD`** and excluded from current implementation until defined:

| ID | Open Item | Current Handling |
|---|---|---|
| `TBD-01` | **Excel Data Migration** | Historical Excel import and cutover reconciliation are `TBD`. |
| `TBD-02` | **Payroll & Extra Components** | Payslips, tax deductions, and payroll runs are `TBD` (current build covers monthly base salary only). |
| `TBD-03` | **Deployment & Infrastructure** | All deployment work is `TBD`: hosting, environments, CI/CD pipelines, TLS termination, secrets storage, backups and recovery targets, infrastructure monitoring and alerting, and the support SLA. The application itself is engineered to run on any host (environment-variable configuration, health endpoints, stdout logging). |
| `TBD-04` | **Commercials & Sign-Off Contacts** | Pricing model, payment milestones, and formal sign-off names are `TBD`. |

---

## 4. Readiness Summary

- **Core Application Build:** **Ready once the five Open Decisions are confirmed.** Business rules, data structures, concurrency locks, permissions, and APIs are aligned. The decisions below change behavior and must be answered before the affected modules are built.
- **Production Rollout:** **Pending `TBD` Closure.** `TBD-01` (Excel migration), `TBD-03` (hosting/backups), and `TBD-04` (commercials, NDA, and data processing agreement) must be finalized prior to live production cutover.

## 5. Open Decisions (Client Confirmation Required)

Full detail and recommendations are in SDD §11.

| ID | Decision | Current Specification |
|---|---|---|
| `OD-01` | OTP validity | 24 hours as stated by the client; shorter validity (10–15 minutes) is recommended. |
| `OD-02` | Meaning of "Waiting on management approval" | The pending change counts as the salary in force and is flagged. |
| `OD-03` | Self-edit | Users with `write` or `edit` may modify their own records; blocking self-salary edits is recommended. |
| `OD-04` | Salary visibility and export | Every user with `read` sees all salaries and can export the full filtered dataset; separate `salary:view` and `export` permissions are recommended. The audit log is already limited to the HR Manager. |
| `OD-05` | HR Manager rights | The HR Manager can invite other HR Managers and implicitly holds all four permissions. |

## Approved decision addendum — ADR-005 (22 November 2026)

Client approval supersedes conflicting baseline account-linkage and initial-salary rules. Independent HR links an existing employee/account with a reason and confirmation; one active account per employee; no self-linking or unauthorized relinking. Backend/database must audit actor,time,reason,old/new employee details and invalidate affected sessions/relevant snapshots. Unlinked accounts cannot modify/approve salaries. Initial salaries remain Pending Approval (including past effective dates) until a different authorized HR approves; preserve original effective date and creator/approver/reason/approval timestamp. Creator cannot approve their own entry. Employee creation must atomically save the pending request,not a finalized salary. See [canonical decisions](../acme-salary-app/docs/DECISIONS.md#adr-005--verified-employee-linkage-and-initial-salary-approval). Approval is not an implementation claim; P5a directory is read-only,linkage/creation need reviewed schema/service/UI/tests next.
