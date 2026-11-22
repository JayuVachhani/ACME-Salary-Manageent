# Functional Requirements Document (FRD)
> Current approved precedence (22 November 2026): [DECISIONS.md](../acme-salary-app/docs/DECISIONS.md) supersedes original baseline text: OTP maximum 15 minutes; distinct create/edit rights plus read; separate salary:view/export; no own salary revisions or own permission changes; independent approval for backdated salary. ADR-003 now approves trimmed case-insensitive department/designation names, immutable codes, soft deactivation and referenced-currency precision protection. Salary bands are deferred pending policy approval. Historical option tables below are not current unresolved alternatives for already approved decisions.

> Approved change, 21 November 2026: the addendum at the end supersedes conflicting approval, FX, reporting and retention language in the original baseline.
## ACME Salary Management Platform

| | |
|---|---|
| **Project** | ACME Salary Management Platform |
| **Document Type** | Functional Requirements Document (FRD) |
| **Traces to** | `business_requirements_document_brd.md` (`BR-01`–`BR-15`, `BRL-01`–`BRL-14`) |

**Priority Legend:** **M** Must Have · **S** Should Have

---

## 1. System Conventions
- **API & Precision:** RESTful JSON API under `/api/v1`. Monetary amounts are stored as exact decimals (`NUMERIC(18,4)`) and serialized as strings to eliminate floating-point errors.
- **Monthly Compensation:** All salary inputs, calculations, bands, and reports operate on **monthly** salary amounts.
- **Confirmation Prompts:** Every create or update form in the web interface presents a confirmation summary modal before submitting data to the backend.
- **Server-Side Security:** Every endpoint validates the user's session and checks `read`, `write`, `edit`, or `delete` permissions on the server.

---

## 2. Authentication & Team Access (`FR-AUTH`)

### 2.1 SMTP OTP Authentication
| ID | Requirement | Pri |
|---|---|---|
| FR-AUTH-01 | User enters their registered email address to request a One-Time Password (OTP) sent via SMTP | M |
| FR-AUTH-02 | Each generated OTP remains valid for **24 hours** from issuance | M |
| FR-AUTH-03 | A user has up to **3 verification attempts** per OTP; on the 3rd failed attempt, the OTP is invalidated and a new code must be requested | M |
| FR-AUTH-04 | Login UI includes a **Resend OTP** button; resending invalidates any previous active OTP and sends a fresh 24-hour code | M |
| FR-AUTH-05 | Successful OTP verification immediately marks the OTP as used (single-use) and creates an authenticated server session | M |
| FR-AUTH-06 | Authenticated users can log out, destroying their active session | M |

### 2.2 HR Manager Invites & Permissions
| ID | Requirement | Pri |
|---|---|---|
| FR-AUTH-07 | Only the **HR Manager** can invite new team members and modify user permissions | M |
| FR-AUTH-08 | HR Manager assigns granular permissions to each invited user: **`read`**, **`write`**, **`edit`**, **`delete`** | M |
| FR-AUTH-09 | Permission enforcement is strictly role-based: any user granted `write` or `edit` permission can create or update records (including their own) without self-edit restrictions (see SDD Open Decision OD-03) | M |
| FR-AUTH-10 | When a team member leaves, HR Manager deactivates them via **soft-delete** (`deleted_at` timestamp), preserving their historical attribution in audit and salary history logs | M |
| FR-AUTH-11 | If a previously soft-deleted team member rejoins the organization, HR Manager invites them as a **new user account** with a fresh user ID and permission set | M |
| FR-AUTH-12 | OTP request and verify endpoints are rate-limited: at most 5 OTPs per hour per (email, IP address) pair and 20 per hour per email overall, plus a per-IP request throttle, so a third party cannot lock a user out from another address; the OTP request endpoint returns an identical response whether or not the email is registered, and failed verification returns a generic error | M |
| FR-AUTH-13 | Sessions are stored server-side, protected by an `HttpOnly`, `Secure`, `SameSite=Lax` cookie and a CSRF token on every mutating request, and expire after an idle timeout (default 30 minutes) and an absolute lifetime (default 12 hours) | M |
| FR-AUTH-14 | Soft-deleting a user immediately revokes all of their sessions and open OTPs; permission changes take effect on the user's next request | M |
| FR-AUTH-15 | The system rejects any deletion or demotion that would leave no active HR Manager | M |
| FR-AUTH-16 | The first HR Manager is created by a command-line bootstrap run with database access; it runs once, is audited, and refuses to run when an active HR Manager exists | M |
| FR-AUTH-17 | A non-login system identity owns seed data and command-line actions so every creator and actor reference is valid; it can never request an OTP or appear in the team screen | M |
| FR-AUTH-18 | An invitation expires after 7 days; an expired invitee cannot request an OTP until the HR Manager re-invites them | M |
| FR-AUTH-19 | The HR Manager can invite other HR Managers, and the HR Manager role implies all four permissions (see SDD Open Decision OD-05) | M |

---

## 3. Country Rules & Regulations Module (`FR-CTRY`)

| ID | Requirement | Pri |
|---|---|---|
| FR-CTRY-01 | Country Rules module allows the HR Manager to configure each country's default currency (ISO 4217), decimal places (`0`–`4`), rounding mode (`HALF_UP`, `FLOOR`, `CEIL`), regulatory policy notes, and retention policy | M |
| FR-CTRY-02 | Employees inherit the currency, rounding, and regulatory rules of their assigned country | M |
| FR-CTRY-03 | Monetary displays and calculations apply the applicable country's decimal and rounding rules | M |
| FR-CTRY-04 | Employee and salary records are retained until explicitly removed in compliance with country policy | M |
| FR-CTRY-05 | Each salary record stores a snapshot of the country's decimal places and rounding mode at write time, so later edits to country rules never change historical figures | M |
| FR-CTRY-06 | Country rule edits are version-checked, so two concurrent edits cannot silently overwrite each other, and every change is audited | M |

---

## 3b. Reference Data: Currencies, FX Rates & Salary Bands (`FR-REF`)

| ID | Requirement | Pri |
|---|---|---|
| FR-REF-01 | The system provides a read-only list of ISO 4217 currencies with their minor units | M |
| FR-REF-02 | The HR Manager can add and correct exchange rates per currency pair and date; every change is audited with the previous value, and all users with `read` can view them | M |
| FR-REF-03 | The HR Manager can create, edit, and delete salary bands, each defined in a single currency with an inclusive minimum and an exclusive maximum; all users with `read` can view them | M |
| FR-REF-04 | The seed script loads currencies, country rules, FX rates, and salary bands along with the employees | M |

---

## 4. Employee Management (`FR-EMP`)

| ID | Requirement | Pri |
|---|---|---|
| FR-EMP-01 | Create employee with `employee_code` and `email` (each unique among non-removed employees), `first_name`, `last_name`, `country_code`, `department`, `designation`, `joining_date`, and `status` (`ACTIVE`/`INACTIVE`) | M |
| FR-EMP-02 | Display confirmation modal before saving a new employee or updating an existing profile | M |
| FR-EMP-03 | Case-insensitive partial search across `employee_code`, full name, and `email` | M |
| FR-EMP-04 | Multi-criteria filtering by country, department, status, and monthly salary band; sorting by code, name, joining date, department, or country; server-side pagination (default 25, max 100) | M |
| FR-EMP-05 | Cross-country transfers update the employee's country, add a new salary ledger row on the transfer date carrying the new country's rounding rules, and write an explicit cross-country/currency transition event into history without breaking prior records; a transfer cannot share an effective date with an existing salary row | M |
| FR-EMP-06 | Record removal is a soft removal (`removed_at`), respects country retention policies, and requires `delete` permission; permanent purge is outside this release | M |
| FR-EMP-07 | Soft-removed employees are excluded from search, headcount, analytics, and reports; their history remains in the audit log | M |
| FR-EMP-08 | Employee search treats `%`, `_`, and `\` typed by the user as literal characters | M |

---

## 5. Monthly Salary Management, Pessimistic Locking & History (`FR-SAL`)

### 5.1 Pessimistic Concurrency Locking
| ID | Requirement | Pri |
|---|---|---|
| FR-SAL-01 | Opening an employee or salary form in edit mode acquires an exclusive **pessimistic lock** on that employee record; any user with `write` or `edit` permission may acquire it | M |
| FR-SAL-02 | While locked, any other user attempting to open the same record for editing is blocked (displaying the lock holder's name and lock timestamp); there is no queue | M |
| FR-SAL-03 | The lock is released immediately upon save or cancel. While the form is open the client sends a heartbeat every 60 seconds, and the lock automatically expires after **15 minutes** without a heartbeat to prevent abandoned locks | M |
| FR-SAL-14 | Every write to an employee or its salary history is checked against the employee's `version`; a stale version is rejected with a conflict error, so no update is ever silently lost even if a lock expires | M |
| FR-SAL-15 | If the lock is lost before saving, the user is warned and their entered data is preserved on screen; the save is rejected rather than applied | M |

### 5.2 Salary Revisions, Typo Corrections & Approval Tracking
| ID | Requirement | Pri |
|---|---|---|
| FR-SAL-04 | Salaries are stored as **monthly** amounts (`> 0`) paired with an active ISO-4217 currency code | M |
| FR-SAL-05 | Existing salary records are **never updated or deleted** (enforced by the database); every change, including a typo correction, inserts a new record into the salary ledger, and a typo correction references the record it corrects | M |
| FR-SAL-06 | Submitting a salary entry or typo correction triggers a **confirmation modal** displaying current vs. proposed monthly pay, currency/conversion details, effective date, and reason | M |
| FR-SAL-07 | Typo corrections and salary changes require a non-empty **reason** and are recorded in history with status **`Waiting on management approval`** | M |
| FR-SAL-08 | Items with status `"Waiting on management approval"` are clearly displayed in history with no further approval workflow actions in this release | M |
| FR-SAL-09 | Cross-currency salaries (salary currency ≠ employee country's default currency) are allowed when paired with an explicit exchange rate and rate date, logged transparently in history and audit tracking | M |
| FR-SAL-10 | Effective date periods for an employee cannot overlap; period end dates are derived from the next record's effective date rather than stored, and effective date changes are tracked in history with reason and timestamp | M |
| FR-SAL-17 | For an initial salary or a revision, the effective date may not be earlier than the employee's joining date | M |
| FR-SAL-16 | The salary in force for an employee is the latest uncorrected record whose effective date is on or before the as-of date (default: today's UTC date). A record with status `Waiting on management approval` counts as in force and is displayed with a pending badge (see SDD Open Decision OD-02) | M |

### 5.3 History Timeline & Table View
| ID | Requirement | Pri |
|---|---|---|
| FR-SAL-11 | Employee profile displays salary and transfer history in both a visual **timeline** and a structured **table** | M |
| FR-SAL-12 | Every history entry displays **`change_type`** (`INITIAL`, `REVISION`, `TYPO_CORRECTION`, `COUNTRY_TRANSFER`, `CURRENCY_CHANGE`), **`description`** (reason, before/after amounts, conversion details), **`status`** (`ACTIVE` or `Waiting on management approval`), **`updated_at`**, and **`updated_by`** | M |
| FR-SAL-13 | Cross-country and currency transitions display clear before → after country and currency indicators so multi-country history remains easy to follow | M |

---

## 6. Analytics, Pre-Filtered Reporting & CSV Export (`FR-ANA` / `FR-REP`)

| ID | Requirement | Pri |
|---|---|---|
| FR-ANA-01 | Dashboard displays active headcount and monthly salary metrics grouped by country and department | M |
| FR-ANA-02 | Cross-currency totals and averages apply documented conversion rates and rate-date rules; converted metrics display the target currency and conversion date used | M |
| FR-ANA-03 | All monetary figures follow country-specific decimal and rounding rules; aggregates spanning several countries use the target currency's minor units with `HALF_UP` and are rounded once after summation | M |
| FR-ANA-04 | Exchange rate lookup uses the latest rate on or before the requested date, within a configurable staleness limit (default 7 days); if no rate qualifies the operation is rejected with a clear error | M |
| FR-ANA-05 | A missing direct currency pair is resolved through the inverse rate, then through the pivot currency USD; the path used is logged with the conversion | M |
| FR-ANA-06 | Salary-band filters convert each salary into the band's currency at the report's as-of date and test the range inclusive of the minimum and exclusive of the maximum | M |
| FR-REP-01 | Reports require users to configure and apply **pre-report filters** (country, department, status, salary band, effective date, target currency) prior to generation | M |
| FR-REP-02 | CSV export outputs the exact filtered dataset shown in the report preview and escapes formula-injection characters (`=`, `+`, `-`, `@`, tab, carriage return) | M |
| FR-REP-03 | Every CSV export is logged in the audit trail (user, filters applied, row count, timestamp) | M |
| FR-REP-04 | Reports and exports take an as-of date (default: today's UTC date), shown in the report; an export made with the same filters and as-of date matches the preview | M |

---

## 7. Audit Trail (`FR-AUD`)

| ID | Requirement | Pri |
|---|---|---|
| FR-AUD-01 | All salary updates, typo requests, cross-country transfers, currency conversions, employee changes, and user/permission updates write an append-only audit entry in the same database transaction | M |
| FR-AUD-02 | Audit records store `actor_id`, `entity_type`, `entity_id`, `change_type`, `description`, `payload` (before/after state & conversion metadata), and `created_at` | M |
| FR-AUD-03 | Audit logs cannot be updated or deleted (enforced by a database trigger and by restricted privileges on the application role) and are viewable by the HR Manager through a searchable, filterable Audit Log screen (payloads contain salary values, so the `read` permission does not grant access) | M |
| FR-AUD-04 | Security events are audited independently of the triggering request so they persist even when it fails: login success, failed OTP verification, OTP issued or invalidated, session revoked, rate-limit rejections, and a lock taken over from an expired holder | M |
| FR-AUD-05 | Report generation, CSV export, and views of an employee's salary history are audited with the user and the filters or employee involved | M |
| FR-AUD-06 | Audit entries for unknown or unregistered login identifiers store a hash of the email, never the address itself | M |

---

## 8. Non-Functional & Data Requirements (`NFR`)

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Scale & Seed | Support ≥ 15,000 employees; include a deterministic **10,000-employee synthetic seed script** spanning multiple countries, currencies, cross-country transfers, and pending approval items |
| NFR-02 | Performance | Search and list queries respond in ≤ 500 ms (p95); filtered reports and analytics load in ≤ 1.5 s at 10,000+ records |
| NFR-03 | Data Integrity | Exact `NUMERIC(18,4)` money storage, country-rule rounding, pessimistic edit locks, and atomic DB transactions |
| NFR-04 | Security | Server-side permission guards (`read`/`write`/`edit`/`delete`), HTTPS (certificate and termination are `TBD-03`; local development may relax secure cookies through an explicit setting that production refuses), rate-limited OTP endpoints, and scrubbed application logs (no raw salary values in server logs) |
| NFR-05 | Open Items (`TBD`) | Excel data migration (`TBD-01`), payroll/extra compensation (`TBD-02`), all deployment and infrastructure work (`TBD-03`: hosting, environments, CI/CD, TLS termination, secrets storage, backups and recovery targets, infrastructure monitoring), and commercials and sign-off (`TBD-04`) are deferred until defined |
| NFR-06 | Operability | The application is configured only through environment variables that are validated at startup (it refuses to start on missing or invalid values), writes structured JSON logs with request IDs and redaction of salary values, OTPs, and credentials, exposes unauthenticated liveness and readiness endpoints, and shuts down gracefully |
| NFR-07 | Verifiability | Database constraints, triggers, views, and locking are verified by integration and concurrency tests against a real PostgreSQL instance; one local command runs lint, type-check, migrations, all tests, and the seed determinism check |
| NFR-08 | Database Safety | The application database role is granted only the privileges it needs, has no DDL rights and no `UPDATE`, `DELETE`, or `TRUNCATE` on the audit and ledger tables, and statement-level triggers also block `TRUNCATE` by the table owner; statement and idle-transaction timeouts are set; migrations are forward-only and tested from an empty database and from the previous release |
| NFR-09 | Business Date | Every "today" and default as-of date is the UTC date computed by the application; the database session timezone never decides a business date |

## 9. Approved requirements addendum (21 November 2026)

| ID | Requirement |
|---|---|
| FR-APR-01 | All salary changes effective before today's application-computed UTC date require an HR Manager request with a nonempty reason. Dates cannot precede joining date. |
| FR-APR-02 | Pending requests are separate from salary ledger rows and excluded from salary-in-force selection, derived periods, reports and calculations. Rejected requests never alter the original salary. |
| FR-APR-03 | Another active HR Manager approves/rejects with comments; requester and salary subject cannot approve. Decision and submission store actors, timestamps and audit events. |
| FR-APR-04 | No duplicate pending request for an employee/effective date. Approval atomically revalidates eligibility, date collision, current version/policy/FX basis, appends salary/history/audit and records decision. Failure applies none of these changes. |
| FR-APR-05 | Rejected requests are retained; corrected resubmission creates a fresh request. Requester can see status. No broad approval hierarchy is introduced. |
| FR-REF-05 | FX rate corrections append immutable revisions with pair, rate, effective date, source and responsible user. No ad hoc per-salary overrides. Historical reports select historical effective rates and store chosen revision/path provenance. |
| FR-SAL-18 | Reject entered salaries exceeding country precision. Ordinary revisions/transfers reject occupied dates; same-date typo correction chains remain the explicit exception. Future/backdated changes preserve complete history. |
| FR-REP-05 | Snapshots expire after 30 minutes and revalidate current permissions/status on every access/export. Relevant permission changes and employee removal invalidate affected snapshots. |
| FR-EMP-09 | Active retention holds prevent employee or protected-record removal/deletion; placement/release is HR-controlled and audited. |

FR-APR supersedes FR-SAL-08/16 and deferred approval exclusions only for backdated changes. Non-backdated changes keep existing baseline behavior. Detailed implementation and tests must map to these IDs.
