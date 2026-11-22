# Statement of Work (SOW)
> Current approved precedence (22 November 2026): [DECISIONS.md](../acme-salary-app/docs/DECISIONS.md) supersedes original baseline text: OTP maximum 15 minutes; distinct create/edit rights plus read; separate salary:view/export; no own salary revisions or own permission changes; independent approval for backdated salary. ADR-003 now approves trimmed case-insensitive department/designation names, immutable codes, soft deactivation and referenced-currency precision protection. Salary bands are deferred pending policy approval. Historical option tables below are not current unresolved alternatives for already approved decisions.

> Approved scope change, 21 November 2026: a minimal backdated-salary HR Manager approve/reject workflow is now included, superseding the blanket exclusion of approval actions for that case only. See BRD/FRD/SDD approved addenda and ADR-002. Broad approval workflows, payroll, production infrastructure and migration remain excluded. Re-estimate the affected work after implementation design; no new fixed delivery date is agreed.
## ACME Salary Management Platform

| | |
|---|---|
| **Project** | ACME Salary Management Platform |
| **Client** | ACME *(legal entity TBD)* |
| **Supplier** | *(TBD)* |
| **Companion Docs** | `requirement_review_scope_baseline.md`, `business_requirements_document_brd.md`, `functional_requirements_document_frd.md`, `system_design_document_sdd.md` |

---

## 1. Purpose & Project Classification
This Statement of Work defines the scope, deliverables, engineering approach, timeline estimate, and open `TBD` boundaries for building the **ACME Salary Management Platform**.

The platform is delivered as a **real, build-ready web application** for managing monthly employee salaries across multiple countries. Production rollout is gated by closure of `TBD-01`, `TBD-03`, and `TBD-04` and by the NDA and data processing agreement. It is validated with a **10,000-employee synthetic seed dataset** and accompanied by a walkthrough demo video recorded once development and testing are complete.

---

## 2. Scope of Work

### 2.1 In Scope
1. **Authentication & Team Access:**
   - Passwordless login via SMTP email OTP (24-hour expiry, maximum 3 attempts, resend support).
   - HR Manager invite workflow and granular role permissions (`read`, `write`, `edit`, `delete`).
   - Soft-deletion of departed team members (preserving historical logs) and fresh onboarding if re-invited.
   - Command-line bootstrap of the first HR Manager, and a non-login system identity for seed data.
2. **Country Rules & Regulations Module and Reference Data:**
   - Per-country configuration of default currency, decimal/rounding rules, regulatory policy notes, and retention rules automatically applied to employees in that country.
   - HR Manager maintenance of exchange rates and salary bands, with a read-only currency list.
3. **Employee Management:**
   - Employee CRUD, partial search (code, name, email), multi-filter directory, sorting, pagination, cross-country transfers, and confirmation dialogs before saving.
4. **Monthly Salary Engine, Pessimistic Locking & History:**
   - Monthly base salary tracking with strict non-overwrite history.
   - Confirmation modal before saving any record, mandatory reason capture, and `"Waiting on management approval"` status tracking in history.
   - Timeline and table history views displaying `change_type`, `description`, `updated_at`, and clear cross-country / currency transitions.
   - Pessimistic locking when a user opens a record for editing (with 15-minute auto-release timeout).
5. **Multi-Currency Analytics & Pre-Filtered Reporting:**
   - Cross-currency compensation support with logged conversion rates and date rules, country-wise rounding, upfront report filters (including salary bands), dashboard metrics, and CSV export.
6. **Audit Trail & 10,000-Record Seed Script:**
   - Transactional append-only audit log and a deterministic 10,000-employee synthetic dataset.
7. **Quality Assurance, Documentation & Demo Recording:**
   - Unit, property-based, real-database integration, concurrency, permission-matrix, end-to-end, performance, and security tests, all runnable locally with a single command; OpenAPI/Swagger documentation, user/technical guides, and end-of-project demo recording.
   - Application operability that does not depend on hosting: validated configuration, structured redacted logging, health endpoints, graceful shutdown, and forward-only database migrations.

### 2.2 Out of Scope
- Automated downstream management approval workflows (changes are tracked with status `"Waiting on management approval"` in history with no approval workflow actions in this phase).
- Permanent purge of removed employee or salary data (records are soft-removed and hidden; a purge procedure needs a legally approved policy).
- External HRIS integrations, native mobile apps, and multi-tenancy.

### 2.3 Open Items (`TBD` — Excluded Until Defined)
| ID | Item | Status |
|---|---|---|
| `TBD-01` | Excel data migration & reconciliation tooling | **TBD** |
| `TBD-02` | Payroll processing, payslips, tax & deductions | **TBD** (current scope is monthly base salary only) |
| `TBD-03` | All deployment and infrastructure work: hosting, environments, CI/CD pipelines, TLS termination, secrets storage, backups and recovery targets, infrastructure monitoring, post-launch SLA | **TBD** |
| `TBD-04` | Commercial pricing, milestones & legal sign-off contacts | **TBD** |

---

## 3. Deliverables

| # | Deliverable | Acceptance Criteria |
|---|---|---|
| D1 | Baseline Specifications (the five Markdown documents: scope baseline, BRD, FRD, SOW, SDD) | Approved scope and design baseline |
| D2 | Source Code Repository (React Frontend + NestJS Backend + DB Migrations) | Clean build, linted, and code-reviewed |
| D3 | SMTP OTP Auth & HR Manager Invite / Permission Module | 24h expiry, 3-try limit, resend, and `read`/`write`/`edit`/`delete` tests pass |
| D4 | Country Rules & Regulations Module | Country rounding, default currency, and policy inheritance verified |
| D5 | Employee & Monthly Salary Engine (Pessimistic Locking & History) | Lock contention, non-overwrite ledger, confirmation modals, and history timeline/table tests pass |
| D6 | Analytics Dashboard & Pre-Filtered Reporting / CSV Export | Cross-currency conversion, rounding, pre-report filters, and CSV export verified |
| D7 | 10,000-Employee Deterministic Seed Script | Populates 10,000 multi-country records cleanly |
| D8 | Automated Test Suite & OpenAPI Documentation | Unit, integration, concurrency, security, and E2E suites pass; API docs published |
| D9 | End-of-Project Demo Recording | Recorded after development and testing complete |

---

## 4. Engineering Approach & Standards
- **Right-Sized Architecture:** Clean modular monolith backed by PostgreSQL—prioritizing data integrity, clear code, and maintainability over unnecessary infrastructure complexity.
- **Data Integrity Safeguards:** Atomic database transactions, append-only salary and audit records, pessimistic record locks with timeout protection, and mandatory UI confirmation dialogs.
- **Definition of Done:** Code implemented and reviewed, automated tests passing, confirmation and permission rules verified, and documentation updated.
- **Go-Live Gate:** No real employee data is loaded and no production cutover occurs until `TBD-01`, `TBD-03`, and `TBD-04` are closed, the NDA and data processing agreement are signed, and the Open Decisions `OD-01` to `OD-05` in the SDD are confirmed.

---

## 5. Estimated Timeline & Phases

| Scope Track | Team Composition | Estimated Duration | Included Work |
|---|---|---|---|
| **Core Build (Confirmed Scope)** | 2 Full-Stack Engineers + QA, or 1 Engineer + QA | **7–8 Weeks with two engineers; 9–10 Weeks with one** (a planning estimate, to be re-checked once `OD-01` to `OD-05` are answered) | SMTP OTP auth, HR invites/roles, Country Rules, Employee & Monthly Salary Engine, Pessimistic Locking, History Timeline/Table, FX/Filtered Reports, 10k Seed, Security Hardening, Testing & Demo Video |
| **Add-On: Excel Migration (`TBD-01`)** | +1 Engineer | **+1.5–2 Weeks** | Scoped separately once Excel formats and cleanup rules are defined |
| **Add-On: Deployment & Infrastructure (`TBD-03`)** | +DevOps | **+0.5–1 Week** | Scoped separately once hosting, environments, CI/CD, and backup plans are defined |

### Core Build Schedule (two-engineer plan)
- **Week 1:** Repository setup, PostgreSQL schema and migrations, SMTP OTP login, HR Manager invite and permission system.
- **Week 2:** Country Rules & Regulations module, reference data (FX rates, salary bands), Employee CRUD, search/filtering, confirmation dialogs.
- **Weeks 3–4:** Monthly salary engine, pessimistic locking, non-overwrite history timeline/table, reason capture with `"Waiting on management approval"` status, cross-country/currency tracking.
- **Week 5:** Pre-filtered reports, FX conversion analytics, CSV export, 10,000-employee synthetic seed script.
- **Week 6:** End-to-end testing, concurrency and permission-matrix tests, and bug resolution.
- **Week 7:** Security hardening (rate limits, CSRF, session controls, dependency and ZAP scans), performance testing at 15,000 employees against the NFR targets, and fixes.
- **Week 8 (buffer):** Documentation wrap-up, contingency for slipped work, and demo video recording.

---

## 6. Key Assumptions
1. Working SMTP credentials will be available to test and run email OTP delivery.
2. Exchange rates for cross-currency conversions are maintained via an admin-managed FX rate table unless an external feed is requested later.
3. Development, QA, and demo recordings operate exclusively on the 10,000-record synthetic dataset.
4. Any `TBD` items (`TBD-01` through `TBD-04`) will be formally scoped via change request once requirements are finalized.

---

## 7. Commercials, Hosting & Sign-Off (`TBD`)

| Item | Status |
|---|---|
| Pricing Model & Total Fee (`TBD-04`) | **TBD** |
| Payment Milestones (`TBD-04`) | **TBD** |
| Hosting, Environments, CI/CD & Backup Plan (`TBD-03`) | **TBD** |
| Post-Launch Support & SLA (`TBD-03`) | **TBD** |
| NDA & Data Processing Agreement | **TBD** (required before loading any real employee data) |

| Role | Name | Date | Signature |
|---|---|---|---|
| Client Sponsor | TBD | | |
| Supplier Lead | TBD | | |
