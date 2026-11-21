# System Design Document (SDD)
> Approved change, 21 November 2026: the addendum at the end supersedes conflicting approval, FX, reporting and retention language. Original DDL is a baseline example, not the final migration.
## ACME Salary Management Platform

| | |
|---|---|
| **Project** | ACME Salary Management Platform |
| **Document Type** | System Design Document (SDD) |
| **Traces to** | `functional_requirements_document_frd.md` (`FR-AUTH`, `FR-CTRY`, `FR-EMP`, `FR-SAL`, `FR-ANA`, `FR-REP`, `FR-AUD`, `NFR`) |

---

## 1. Architecture Overview & Engineering Principles

- **Modular Monolith:** Single deployable backend built with **NestJS (TypeScript + Prisma)**, a **React (TypeScript + Vite + Tailwind + shadcn/ui)** single-page frontend, and **PostgreSQL** as the primary datastore.
- **Right-Sized Simplicity:** Built for ~10,000–15,000 employees without unnecessary distributed components (no Redis, Kafka, or microservices), focusing instead on strict database constraints, transactional safety, and clear code boundaries.
- **Build-Ready Integrity:** Validated with a deterministic 10,000-employee synthetic dataset and prepared for end-of-project demo recording after QA sign-off. Production rollout is gated by closure of `TBD-01`, `TBD-03`, and `TBD-04` (see §10).
- **Migrations:** Prisma cannot express GIN expression indexes, partial unique indexes, triggers, or views. These are maintained as raw SQL migrations alongside the Prisma schema.

```
Browser (React SPA — Confirmation Modals, Timeline/Table History, Pre-Report Filters)
   │  HTTPS + HttpOnly Session Cookie + CSRF token header
   ▼
NestJS API (/api/v1 — Modular Monolith)
   ├─ auth          (SMTP OTP generation/verification, 3 tries, resend, rate limits, server-side sessions)
   ├─ team          (HR Manager invites, read/write/edit/delete permissions, soft-delete)
   ├─ country-rules (Country policies, default currency, decimal rounding, retention)
   ├─ employees     (CRUD, trigram search, filters, cross-country transfers, edit locks)
   ├─ salaries      (Immutable monthly ledger, history events, waiting-approval status)
   ├─ fx-analytics  (Currency conversions, rate-date rules, rounded aggregates)
   ├─ reporting     (Pre-filtered reports, safe CSV export)
   └─ audit         (Append-only transactional audit trail)
   ▼
PostgreSQL (NUMERIC money, pg_trgm search, record locks, immutable ledger and audit tables)
```

---

## 2. Core Technical Design Choices

| Domain Area | Design Choice | Technical Rationale |
|---|---|---|
| **Authentication (`FR-AUTH-01..06`)** | SMTP Email OTP + Server-Side Session | 6-digit OTP generated with a CSPRNG and stored as `HMAC-SHA256(server_secret, otp)`. A slow hash adds no protection for a 10⁶ code space, whereas a keyed HMAC is useless to an attacker who steals only the database. Comparison is constant-time. Validity is **24 hours** (client requirement, set by `OTP_TTL_MINUTES`; see OD-01), max **3 attempts**, resend invalidation, single-use consumption. Sessions are stored server-side so they can be revoked. |
| **Team Access (`FR-AUTH-07..11`)** | HR Manager Invites + Permission Array | HR Manager invites teammates and assigns `read`, `write`, `edit`, `delete`. Permissions are read from the database on every request, never from the cookie. Soft-deleted users retain historical attribution; re-invited users receive a new user ID. |
| **Concurrency (`FR-SAL-01..03`, `FR-SAL-14..15`)** | **Pessimistic lock** (`record_locks`) plus an optimistic `version` check | Opening an edit form acquires a lock on `employee_id` through one atomic upsert. The lock lasts 15 minutes and is extended by a heartbeat while the form is open, so it expires after 15 minutes of inactivity. Another editor is blocked with `423` and sees the holder. The lock is a user-experience guard; correctness is enforced by an `employees.version` check inside the write transaction. |
| **Salary Ledger (`FR-SAL-04..10`, `FR-SAL-16`)** | Immutable Monthly Ledger (`NUMERIC(18,4)`) | Rows are never updated or deleted (trigger-enforced). A revision inserts a new row; a typo fix inserts a row whose `corrects_id` points at the corrected row. `effective_to` is not stored: period ends are derived with `LEAD(effective_from)`, so periods cannot overlap. Revisions and typo fixes carry `approval_status = 'WAITING_MANAGEMENT_APPROVAL'` and a mandatory `change_reason`. The `current_salary` view defines the salary in force. |
| **History View (`FR-SAL-11..13`)** | Dedicated `salary_history_events` table (immutable) | Explicitly stores `change_type`, `description`, `updated_at`, `updated_by`, old/new values, and cross-country/currency switches so multi-country history never breaks. |
| **Country Rules (`FR-CTRY-01..05`)** | `country_rules` table | Stores default currency, decimal precision, rounding mode, policy notes, and retention rules per country. Each salary row snapshots the rule used, so later rule edits never alter history. |
| **Currency & Rounding (`FR-ANA-02..06`)** | `currencies` + `fx_rates` + Country Rounding Utility | Lookup, triangulation, staleness, and rounding rules are defined in §5.4. Cross-currency salaries and reports record `(rate, rate_date, source)`. |
| **Search (`FR-EMP-03`)** | PostgreSQL `pg_trgm` GIN Indexes | Enables fast case-insensitive substring search (`ILIKE`) across employee code, name, and email at 10k+ scale. |

---

## 3. PostgreSQL Database Schema (DDL)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

-- 0. Currencies (ISO 4217 minor units)
CREATE TABLE currencies (
  code         char(3) PRIMARY KEY,                 -- ISO 4217 (e.g., INR, USD, GBP, EUR, JPY)
  minor_units  smallint NOT NULL CHECK (minor_units BETWEEN 0 AND 4),
  is_active    boolean NOT NULL DEFAULT true
);

-- 1. Country Rules & Regulations Module
CREATE TABLE country_rules (
  country_code      char(2) PRIMARY KEY,            -- ISO 3166-1 alpha-2 (e.g., IN, US, GB, DE)
  country_name      text NOT NULL UNIQUE,
  default_currency  char(3) NOT NULL REFERENCES currencies(code),
  -- A value different from currencies.minor_units is allowed but the UI confirmation modal must warn.
  decimal_places    smallint NOT NULL DEFAULT 2 CHECK (decimal_places BETWEEN 0 AND 4),
  rounding_mode     text NOT NULL DEFAULT 'HALF_UP' CHECK (rounding_mode IN ('HALF_UP','FLOOR','CEIL')),
  retention_policy  text NOT NULL DEFAULT 'KEEP_UNTIL_REMOVED',
  regulations_meta  jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active         boolean NOT NULL DEFAULT true,
  version           integer NOT NULL DEFAULT 1,     -- optimistic concurrency token for concurrent rule edits
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 2. System Users, HR Invites & Role Permissions
CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext NOT NULL,
  full_name      text NOT NULL,
  is_hr_manager  boolean NOT NULL DEFAULT false,    -- Only HR Manager can invite & manage roles
  permissions    text[] NOT NULL DEFAULT ARRAY['read'],
  status         text NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED','ACTIVE','DELETED')),
  invited_by     uuid REFERENCES users(id),
  invite_expires_at timestamptz,                    -- INVITED users cannot request an OTP after this (default: 7 days)
  is_system      boolean NOT NULL DEFAULT false,    -- non-login identity that owns seed data and CLI actions
  deleted_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (permissions <@ ARRAY['read','write','edit','delete'])
);
-- Active/invited users have unique emails; soft-deleted users can be re-invited as new accounts
CREATE UNIQUE INDEX users_active_email_uq ON users(email) WHERE status <> 'DELETED';

-- 3. SMTP OTP Authentication
CREATE TABLE auth_otps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id),
  otp_hash     text NOT NULL,                       -- HMAC-SHA256(server_secret, otp), hex
  attempts     smallint NOT NULL DEFAULT 0 CHECK (attempts <= 3),
  expires_at   timestamptz NOT NULL,                -- created_at + OTP_TTL_MINUTES (24 hours by client requirement)
  consumed_at  timestamptz,
  invalidated  boolean NOT NULL DEFAULT false,
  requested_ip inet,                                -- used for the per-(email, IP) rate limit
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_otps_user_idx ON auth_otps(user_id, created_at DESC);
CREATE INDEX auth_otps_user_ip_idx ON auth_otps(user_id, requested_ip, created_at DESC);

-- 3b. Server-Side Sessions (revocable)
CREATE TABLE sessions (
  id_hash       text PRIMARY KEY,                   -- SHA-256 of the opaque session token
  user_id       uuid NOT NULL REFERENCES users(id),
  csrf_hash     text NOT NULL,                      -- SHA-256 of the CSRF token issued with the session
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,               -- absolute lifetime
  revoked_at    timestamptz
);
CREATE INDEX sessions_user_idx ON sessions(user_id) WHERE revoked_at IS NULL;

-- 4. Employees
CREATE TABLE employees (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code  text NOT NULL,
  first_name     text NOT NULL,
  last_name      text NOT NULL,
  email          citext NOT NULL,
  country_code   char(2) NOT NULL REFERENCES country_rules(country_code),
  department     text NOT NULL,
  designation    text NOT NULL,
  joining_date   date NOT NULL,
  status         text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  removed_at     timestamptz,                       -- Soft removal; permanent purge is outside this release
  version        integer NOT NULL DEFAULT 1,        -- Optimistic concurrency token, incremented on every write
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
-- Uniqueness applies to non-removed employees only (BRL-01)
CREATE UNIQUE INDEX emp_code_active_uq  ON employees(employee_code) WHERE removed_at IS NULL;
CREATE UNIQUE INDEX emp_email_active_uq ON employees(email)         WHERE removed_at IS NULL;
CREATE INDEX emp_name_trgm  ON employees USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX emp_email_trgm ON employees USING gin ((email::text) gin_trgm_ops);
CREATE INDEX emp_code_trgm  ON employees USING gin (employee_code gin_trgm_ops);
CREATE INDEX emp_filter_idx ON employees(country_code, department, status);

-- 5. Pessimistic Record Locks
CREATE TABLE record_locks (
  employee_id  uuid PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  locked_by    uuid NOT NULL REFERENCES users(id),
  locked_at    timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL                 -- now() + 15 minutes, extended by heartbeat
);

-- 6. Monthly Salary Ledger (Immutable: rows are never updated or deleted)
CREATE FUNCTION block_ledger_modify() RETURNS trigger LANGUAGE plpgsql AS
$$ BEGIN RAISE EXCEPTION '% is immutable', TG_TABLE_NAME; END $$;

CREATE TABLE salary_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       uuid NOT NULL REFERENCES employees(id),
  corrects_id       uuid REFERENCES salary_records(id),  -- set on TYPO_CORRECTION rows; points at the corrected row
  monthly_amount    numeric(18,4) NOT NULL CHECK (monthly_amount > 0),
  currency          char(3) NOT NULL REFERENCES currencies(code),
  country_code      char(2) NOT NULL REFERENCES country_rules(country_code),
  decimal_places    smallint NOT NULL,              -- snapshot of the country rule at write time
  rounding_mode     text NOT NULL,                  -- snapshot of the country rule at write time
  is_cross_currency boolean NOT NULL DEFAULT false,
  fx_rate_used      numeric(18,8),                  -- Recorded when currency != country default
  fx_rate_date      date,
  effective_from    date NOT NULL,
  approval_status   text NOT NULL DEFAULT 'ACTIVE'
                    CHECK (approval_status IN ('ACTIVE','WAITING_MANAGEMENT_APPROVAL')),
  change_reason     text NOT NULL,
  created_by        uuid NOT NULL REFERENCES users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT is_cross_currency OR (fx_rate_used IS NOT NULL AND fx_rate_date IS NOT NULL))
);
-- One non-correction row per employee per effective date, so periods cannot overlap
CREATE UNIQUE INDEX salary_emp_effective_uq ON salary_records(employee_id, effective_from)
  WHERE corrects_id IS NULL;
-- A row can be corrected at most once; corrections form a linear chain
CREATE UNIQUE INDEX salary_corrects_uq ON salary_records(corrects_id) WHERE corrects_id IS NOT NULL;
CREATE INDEX salary_emp_idx ON salary_records(employee_id, effective_from DESC);
CREATE TRIGGER salary_no_update_delete BEFORE UPDATE OR DELETE ON salary_records
  FOR EACH ROW EXECUTE FUNCTION block_ledger_modify();

-- Period view: effective_to is derived, never stored. Superseded (corrected) rows are excluded.
CREATE VIEW salary_periods AS
SELECT s.*,
       LEAD(s.effective_from) OVER (PARTITION BY s.employee_id ORDER BY s.effective_from) AS effective_to
FROM salary_records s
WHERE NOT EXISTS (SELECT 1 FROM salary_records c WHERE c.corrects_id = s.id);

-- Salary in force on a business date. A WAITING_MANAGEMENT_APPROVAL row counts as in force (see OD-02).
-- "As of" is an effective date, not a knowledge date: a correction entered today changes past as-of results.
CREATE FUNCTION salary_in_force(as_of date) RETURNS SETOF salary_records
LANGUAGE sql STABLE AS $$
  SELECT DISTINCT ON (s.employee_id) s.*
  FROM salary_records s
  WHERE s.effective_from <= as_of
    AND NOT EXISTS (SELECT 1 FROM salary_records c WHERE c.corrects_id = s.id)
  ORDER BY s.employee_id, s.effective_from DESC, s.created_at DESC
$$;

-- "Today" is always the UTC date, never the database session's timezone.
CREATE VIEW current_salary AS
SELECT * FROM salary_in_force((now() AT TIME ZONE 'UTC')::date);

-- 7. Clear History Timeline & Table (Cross-Country & Currency Switch Tracking)
CREATE TABLE salary_history_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      uuid NOT NULL REFERENCES employees(id),
  salary_record_id uuid REFERENCES salary_records(id),
  change_type      text NOT NULL
                   CHECK (change_type IN ('INITIAL','REVISION','TYPO_CORRECTION','COUNTRY_TRANSFER','CURRENCY_CHANGE')),
  description      text NOT NULL,                   -- Human-readable summary + reason
  approval_status  text NOT NULL DEFAULT 'ACTIVE'
                   CHECK (approval_status IN ('ACTIVE','WAITING_MANAGEMENT_APPROVAL')),
  old_country      char(2),
  new_country      char(2),
  old_currency     char(3),
  new_currency     char(3),
  old_amount       numeric(18,4),
  new_amount       numeric(18,4),
  conversion_meta  jsonb,                           -- { rate, rateDate, path, convertedAmount } when cross-currency
  updated_by       uuid NOT NULL REFERENCES users(id),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX history_emp_idx ON salary_history_events(employee_id, updated_at DESC);
CREATE TRIGGER history_no_update_delete BEFORE UPDATE OR DELETE ON salary_history_events
  FOR EACH ROW EXECUTE FUNCTION block_ledger_modify();

-- 8. FX Rates & Salary Bands
CREATE TABLE fx_rates (
  base_currency  char(3) NOT NULL REFERENCES currencies(code),
  quote_currency char(3) NOT NULL REFERENCES currencies(code),
  rate_date      date NOT NULL,
  rate           numeric(18,8) NOT NULL CHECK (rate > 0),   -- 1 base = rate quote
  source         text NOT NULL DEFAULT 'MANUAL',
  PRIMARY KEY (base_currency, quote_currency, rate_date)
);

CREATE TABLE salary_bands (
  id          serial PRIMARY KEY,
  currency    char(3) NOT NULL REFERENCES currencies(code),
  label       text NOT NULL,
  min_monthly numeric(18,4) NOT NULL,               -- inclusive
  max_monthly numeric(18,4),                        -- exclusive; NULL = open-ended
  CHECK (max_monthly IS NULL OR max_monthly > min_monthly)
);

-- 9. Append-Only Audit Logs
CREATE TABLE audit_logs (
  id          bigserial PRIMARY KEY,
  actor_id    uuid REFERENCES users(id),
  entity_type text NOT NULL,
  entity_id   text NOT NULL,
  change_type text NOT NULL,
  description text NOT NULL,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER audit_no_update_delete BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION block_ledger_modify();

-- 10. TRUNCATE protection (row-level triggers do not fire on TRUNCATE, so use statement-level triggers)
CREATE TRIGGER salary_no_truncate  BEFORE TRUNCATE ON salary_records
  FOR EACH STATEMENT EXECUTE FUNCTION block_ledger_modify();
CREATE TRIGGER history_no_truncate BEFORE TRUNCATE ON salary_history_events
  FOR EACH STATEMENT EXECUTE FUNCTION block_ledger_modify();
CREATE TRIGGER audit_no_truncate   BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION block_ledger_modify();

-- 11. Application role privileges. Nothing is granted by default, so every privilege is listed here.
-- Migrations run under a separate owner role; a future table has no app_role access until a migration grants it.
GRANT USAGE ON SCHEMA public TO app_role;
GRANT SELECT, INSERT, UPDATE         ON currencies, country_rules, fx_rates, users, auth_otps, employees TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON record_locks, sessions, salary_bands TO app_role;
GRANT SELECT, INSERT                 ON salary_records, salary_history_events, audit_logs TO app_role;
GRANT SELECT                         ON salary_periods, current_salary TO app_role;
GRANT EXECUTE ON FUNCTION salary_in_force(date) TO app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_role;
```

---

## 4. API Design (`/api/v1`)

All endpoints return JSON, serialize monetary fields as decimal strings, and enforce `read` / `write` / `edit` / `delete` permissions via NestJS guards. Every mutating request must carry the CSRF token header. Every mutating employee or salary request carries the employee `version` it was based on, and every country-rule edit carries the rule's `version`; a mismatch returns `409 Conflict`. Employee queries, headcount, analytics, and reports exclude soft-removed employees (`removed_at IS NOT NULL`); only the audit log retains their history. Search patterns escape `%`, `_`, and `\` before they reach `ILIKE`.

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| POST | `/auth/otp/request` | Public (rate-limited) | Issue an OTP to an active user's email via SMTP; always responds `202` with the same body |
| POST | `/auth/otp/verify` | Public (rate-limited) | Verify OTP (max 3 tries) and establish session; failures return a generic `401` |
| POST | `/auth/otp/resend` | Public (rate-limited) | Invalidate prior OTP and send a new one |
| POST | `/auth/logout` | Authenticated | Revoke the active session |
| GET | `/auth/me` | Authenticated | Return user profile, `isHrManager`, and `permissions[]` |
| POST | `/team/invite` | HR Manager | Invite user with email, name, and `permissions[]` |
| PATCH | `/team/:id/permissions` | HR Manager | Update team member permissions; rejected if it would leave zero active HR Managers |
| DELETE | `/team/:id` | HR Manager | Soft-delete departed team member (`status = 'DELETED'`), revoke sessions and open OTPs; rejected if it would leave zero active HR Managers |
| GET | `/country-rules` | `read` | List country policies, currencies, decimal rounding, and retention |
| POST / PATCH | `/country-rules` | HR Manager | Create or edit a country rule (requires `version`; audited) |
| GET | `/currencies` | `read` | List ISO 4217 currencies with minor units |
| GET | `/fx-rates` | `read` | List exchange rates by pair and date |
| POST / PATCH | `/fx-rates` | HR Manager | Add or correct a rate for a pair and date; every change is audited with the previous value |
| GET | `/salary-bands` | `read` | List salary bands |
| POST / PATCH / DELETE | `/salary-bands` | HR Manager | Maintain salary bands (audited) |
| GET | `/employees` | `read` | Search (`code`, `name`, `email`), filter (`country`, `department`, `status`, `band`), paginate |
| POST | `/employees` | `write` | Create employee with initial salary in one transaction (inherits country rules; no lock needed for a new record) |
| PATCH | `/employees/:id` | `edit` | Update employee or process cross-country transfer (requires lock and `version`; writes history event) |
| DELETE | `/employees/:id` | `delete` | Soft-remove (`removed_at`) per country retention rule (requires `version`; releases any lock) |
| POST | `/employees/:id/lock` | `write` or `edit` | Acquire the edit lock, or return `423` with the current holder |
| POST | `/employees/:id/lock/heartbeat` | `write` or `edit` | Extend the caller's own lock by 15 minutes; `409` if the lock is lost |
| DELETE | `/employees/:id/lock` | `write` or `edit` | Release the caller's own lock |
| GET | `/employees/:id/history` | `read` | Fetch timeline/table (`change_type`, `description`, `updated_at`, country/currency transitions) |
| POST | `/employees/:id/salaries` | `write` for `INITIAL`; `edit` for `REVISION` and `TYPO_CORRECTION` | Create monthly salary, revision, or typo fix (`Waiting on management approval` + reason); revision and typo fix require the lock and `version` |
| GET | `/analytics/summary` | `read` | Country/department metrics with FX conversion and rounding per §5.4 |
| GET | `/reports/generate` | `read` | Pre-filtered report preview (`country`, `department`, `status`, `band`, `asOf`, `targetCurrency`); `asOf` defaults to today's UTC date and is echoed in the response |
| GET | `/reports/export` | `read` (see OD-04) | Filtered CSV download using the same parameters including `asOf`, so it matches the preview; audited and formula-injection escaped |
| GET | `/audit-logs` | HR Manager | Searchable, filterable view of the append-only audit trail. Audit payloads contain before and after salary values, so this is not available through `read` |

---

## 5. Core Technical Workflows

### 5.1 Pessimistic Edit Locking

1. User clicks **Edit** → frontend calls `POST /employees/:id/lock`. The backend runs one atomic statement:

```sql
INSERT INTO record_locks (employee_id, locked_by, locked_at, expires_at)
VALUES ($1, $2, now(), now() + interval '15 minutes')
ON CONFLICT (employee_id) DO UPDATE
  SET locked_by = EXCLUDED.locked_by,
      locked_at = EXCLUDED.locked_at,
      expires_at = EXCLUDED.expires_at
  WHERE record_locks.expires_at <= now()
     OR record_locks.locked_by = EXCLUDED.locked_by
RETURNING *;
```

   If no row is returned, another user holds an unexpired lock: respond `423 Locked` with `{ lockedBy, lockedAt, expiresAt }`. The UI shows the holder and keeps the form read-only. There is no queue; the user retries after release or expiry.
2. While the form is open the UI calls `POST /employees/:id/lock/heartbeat` every 60 seconds. It runs `UPDATE record_locks SET expires_at = now() + interval '15 minutes' WHERE employee_id = $1 AND locked_by = $2 AND expires_at > now()`. Zero rows updated means the lock was lost; the UI warns the user and keeps their entered data on screen. A lock therefore expires only after 15 minutes without a heartbeat.
3. On confirmation, the API opens one transaction, locks the caller's `record_locks` row with `SELECT … FOR UPDATE`, and verifies it is held by the caller and unexpired. It then writes the business changes with `UPDATE employees … SET version = version + 1 WHERE id = $1 AND version = $2`. Zero rows updated returns `409`. The lock is released (row deleted) in the same transaction.
4. The lock prevents wasted work; the `version` check guarantees no lost update even if a lock expired and was taken by someone else.

### 5.2 Salary Change, Typo Fix & Cross-Country History Transaction

Inside a single PostgreSQL transaction:

1. For `REVISION`, `TYPO_CORRECTION`, and `COUNTRY_TRANSFER`: verify the lock as in §5.1 step 3. Bump `employees.version`, which also serializes concurrent salary writes for the same employee. `INITIAL` runs inside employee creation and needs no lock.
2. Check permission for the change type (`write` for `INITIAL`; `edit` for the others). The self-edit rule is governed by OD-03.
3. Load the employee's `country_rules` row and snapshot `decimal_places` and `rounding_mode`. If the salary currency differs from `default_currency`, resolve the rate per §5.4 and set `is_cross_currency = true`, `fx_rate_used`, and `fx_rate_date`.
4. Validate by change type:
   - `INITIAL`: the employee has no salary row yet.
   - `REVISION`: `effective_from` is not already used by a non-correction row (the unique index enforces this). For `INITIAL` and `REVISION`, `effective_from` may not be earlier than the employee's `joining_date`.
   - `TYPO_CORRECTION`: `corrects_id` references an uncorrected row of the same employee, and the new row copies that row's `effective_from`.
5. Insert the new `salary_records` row with `approval_status = 'WAITING_MANAGEMENT_APPROVAL'` for revisions and typo fixes, and a mandatory `change_reason`. No existing salary row is modified.
6. For `COUNTRY_TRANSFER`: update `employees.country_code` and always insert a new ledger row effective on the transfer date, so the current salary carries the new country's rounding snapshot. The row copies the previous amount and currency; if the request also changes the amount or currency, it carries the new values, the resolved rate, and `approval_status = 'WAITING_MANAGEMENT_APPROVAL'`, otherwise `ACTIVE`. A transfer cannot share an effective date with an existing row. Prior rows keep the snapshot they were written with. If the currency changed, a `CURRENCY_CHANGE` event is recorded in addition to the `COUNTRY_TRANSFER` event. Reports group by `employees.country_code`.
7. Insert a structured entry into `salary_history_events` containing `change_type`, `description`, `old_country`/`new_country`, `old_currency`/`new_currency`, `old_amount`/`new_amount`, `conversion_meta`, `updated_by`, and `updated_at`.
8. Insert an immutable entry into `audit_logs`, delete the lock row, and commit.

### 5.3 SMTP OTP Authentication Lifecycle

- **Request (`POST /auth/otp/request`):**
  - Look up a user with status `ACTIVE`, or `INVITED` with `invite_expires_at` in the future. Never `DELETED`, never `is_system`.
  - If the user exists and fewer than 5 OTPs were issued to that (email, IP address) pair, and fewer than 20 to that email from any address, in the past hour (counted from `auth_otps`), generate a 6-digit code with a CSPRNG and store its HMAC and `requested_ip` in `auth_otps`.
  - After the transaction commits, send the code via SMTP with a connection timeout and one retry. The plaintext code is never stored. If delivery still fails, mark that OTP `invalidated`, log the failure without the code, and rely on the user pressing **Resend**; the response stays `202` either way.
  - Always respond `202` with an identical body, whether or not the email exists, so the endpoint cannot be used to enumerate users.
- **Verify (`POST /auth/otp/verify`):**
  1. Select the user's latest OTP that is not consumed, not invalidated, unexpired, and has `attempts < 3`.
  2. Increment `attempts` with an atomic `UPDATE … RETURNING` before comparing, so parallel guesses cannot exceed three tries.
  3. Compare HMACs in constant time. On a mismatch, return a generic `401`; if `attempts` has reached 3, set `invalidated = true`.
  4. On a match, set `consumed_at = now()`, change status `INVITED` to `ACTIVE` on first login, and create a session (§6).
- **Resend (`POST /auth/otp/resend`):** Marks existing open OTPs for the user as `invalidated = true` and issues a fresh OTP, subject to the same hourly limit.

### 5.4 FX Conversion & Rounding Rules

1. **Rate lookup** for `(from, to, date)`: use the latest `fx_rates` row with `rate_date <= date` and no older than `FX_MAX_STALENESS_DAYS` (default 7). If none exists, reject with `422 FX_RATE_UNAVAILABLE`.
2. **Pair resolution:** use the direct pair; otherwise the inverse (`1 / rate`, 8 decimal places); otherwise triangulate through the pivot currency `USD`. The path used is stored in `conversion_meta.path`.
3. **Stored salary rounding:** a salary entered in a non-default currency is stored in its entered currency, unconverted. The converted value in the country default currency is computed at full `NUMERIC` precision and rounded once with the employee country's `decimal_places` and `rounding_mode` when displayed in history. The snapshot on the row keeps this stable.
4. **Reports and analytics:** converted amounts are summed at full precision and rounded once, using the target currency's `minor_units` and `HALF_UP`, because an aggregate spans countries. Row-level figures in a report use the row's own country snapshot. The report shows the target currency and the as-of date used (default: today).
5. **Salary bands:** each band is defined in its own currency. A band filter converts each employee's salary in force on the report's as-of date into the band's currency, then tests `min_monthly <= amount < max_monthly`.
6. **Business date:** "today" and every default as-of date are the UTC date, computed once per request and passed to `salary_in_force(as_of)`. The database session timezone never decides a business date.

---

## 6. Authentication & Session Security Controls

- **Session cookie:** opaque random token, `HttpOnly; Secure; SameSite=Lax`, stored hashed in `sessions`. Idle timeout 30 minutes and absolute lifetime 12 hours (both configurable). Logout, soft-delete of the user, and a permission change revoke the session or force a re-read.
- **CSRF:** a CSRF token is issued at login, its hash is stored in `sessions.csrf_hash`, and the SPA sends it in a header on every mutating request. Requests without a valid token are rejected with `403`.
- **Rate limiting:** at most 5 OTP issues per hour per (email, IP) pair and 20 per hour per email overall, derived from `auth_otps` with no extra infrastructure. Keying on the pair means a third party cannot lock a user out from another address; the per-email ceiling still caps total volume. Per IP, an in-process NestJS throttler on `/auth/*` (for example 20 requests per 10 minutes). The in-process throttler is correct only while the API runs as a single instance; revisit it before scaling out.
- **Same origin:** the SPA and the API are served from one origin, so no CORS exceptions are needed and `SameSite=Lax` plus the CSRF token is sufficient. How that is arranged in hosting is part of `TBD-03`.
- **Local development:** `Secure` cookies and HSTS require HTTPS. A `DEV_INSECURE_COOKIES=true` setting relaxes this for local runs only; the startup validator refuses it when `NODE_ENV=production`.
- **HR Manager continuity:** deleting or demoting a user is rejected if it would leave no active HR Manager.
- **Invitations expire:** an invited user can request an OTP only until `invite_expires_at` (default 7 days after the invite). The HR Manager can re-invite to reset it.
- **Input and output hardening:** DTO validation with whitelisting (unknown fields rejected), security headers (CSP, HSTS, `X-Content-Type-Options`), CSV cells starting with `=`, `+`, `-`, `@`, tab, or carriage return are prefixed with a single quote, and logs never contain salary values or OTPs.

---

## 7. Audit Coverage & Data Protection

- **Audited events.** Each business change below writes an `audit_logs` row in the same transaction as the change:
  - employee create, update, transfer, and soft-removal;
  - salary `INITIAL`, `REVISION`, `TYPO_CORRECTION`, and currency changes;
  - country rule changes and FX rate changes;
  - team invites, permission changes, and soft-deletes;
  - report generation and CSV export (user, filters, row count);
  - views of an employee's salary history.
- **Security events** are written in their own short transaction, so they persist even when the triggering request fails: login success, failed OTP verification, OTP issued and invalidated, session revoked, rate-limit rejections, and a lock taken over from an expired holder. Heartbeats and list or search reads are not audited, to keep volume meaningful.
- **No raw identifiers for unknown users.** A failed login for an unregistered email is recorded with `entity_type = 'AUTH'` and `entity_id = sha256(lower(email))`, so the log cannot be used to harvest addresses.
- **Retention.** Audit rows are never deleted in this release. Permanent purge of employee or salary data is not implemented: removed employees stay soft-removed and hidden, and a purge procedure needs a legally approved policy first.
- **Database roles.** The application connects as `app_role`, which has no `UPDATE`, `DELETE`, or `TRUNCATE` on `audit_logs`, `salary_records`, or `salary_history_events` and no DDL rights. Migrations run under a separate owner role.
- **Logs and secrets.** Logs never contain salary amounts, OTPs, cookies, or authorization headers (§8). All secrets come from environment variables and are never committed. Where those secrets are stored and how storage and backups are encrypted is infrastructure work under `TBD-03` (§10).

---

## 8. Application Operability (Independent of Hosting)

- **First-user bootstrap.** Login is invite-only, so the first HR Manager is created from the command line with database access: `npm run bootstrap:hr-manager -- --email <address> --name <name>`. It is idempotent, refuses to run if an active HR Manager already exists, and writes an audit entry as the system user.
- **System identity.** A single `users` row with `is_system = true` (status `ACTIVE`, never able to log in, hidden from the team screen) owns the seed data, CLI actions, and their audit entries, so every `created_by` and `actor_id` reference is satisfied.
- **Configuration.** One typed config module validates every environment variable at startup and exits with a clear message if any is missing or invalid. A committed `.env.example` documents each key, such as `DATABASE_URL`, `OTP_HMAC_SECRET`, `OTP_TTL_MINUTES`, `SESSION_IDLE_MINUTES`, `SESSION_ABSOLUTE_HOURS`, `FX_MAX_STALENESS_DAYS`, and the `SMTP_*` settings.
- **Structured logging.** JSON logs carry a request ID (propagated or generated), user ID, route, status, and duration. A central redaction list removes salary amounts, OTPs, cookies, and authorization headers before anything is written.
- **Health endpoints.** `GET /healthz` is a liveness check with no dependencies. `GET /readyz` checks that the database is reachable and migrations are current. Neither returns sensitive data.
- **Graceful shutdown.** On `SIGTERM` the API stops accepting requests, finishes in-flight transactions, and closes the connection pool.
- **Database behavior.** The pool size is configurable. `statement_timeout` and `idle_in_transaction_session_timeout` are set on `app_role`. A deadlock (`40P01`) is retried up to twice. Migrations are forward-only SQL files in the repository, applied with a single command, and tested from an empty database and from the previous release.
- **Single-command verification.** One local command (`npm run verify`) runs lint, type-check, migrations, the full test suite, and the seed determinism check, so the quality gate does not depend on any particular CI product.

---

## 9. Seed Data & Test Strategy

- **10,000-Employee Deterministic Seed Script:** Uses a fixed PRNG seed to generate 10,000 employees across multiple countries and currencies, complete with multi-step monthly salary histories, cross-country transfers showing currency transitions, typo corrections, and sample `"Waiting on management approval"` items. Running it twice must produce identical data.
- **Verification Focus:**
  - Locking: two simultaneous lock requests yield exactly one winner; heartbeat extends the lock; a save after lock loss returns `409`; two writes with a stale `version` yield one rejection.
  - Immutable ledger: updates, deletes, and truncates on `salary_records`, `salary_history_events`, and `audit_logs` are rejected, including when run as the table owner; the `salary_in_force`, `current_salary`, and `salary_periods` objects are correct across revisions, typo corrections, country transfers, and as-of dates.
  - Database privileges: connecting as `app_role`, every table the application needs can be read and written as specified, and `UPDATE`, `DELETE`, and `TRUNCATE` on the ledger and audit tables are denied.
  - Bootstrap: the bootstrap command creates the first HR Manager once, refuses a second run, and the system user can own seed rows but can never log in.
  - Rounding and FX: country-rule rounding (HALF_UP, FLOOR, CEIL, 0–4 decimals), direct/inverse/triangulated conversion, staleness rejection, and band filtering across currencies.
  - Authentication: OTP validity, 3-attempt limit, resend invalidation, replay rejection, enumeration-safe responses, rate limits, CSRF rejection, and session revocation on soft-delete.
  - Authorization: every endpoint exercised by every permission combination, including HR Manager continuity.
- **Test layers.**
  - **Unit and property-based tests** for rounding, FX resolution, and the permission guards, using generated inputs across all rounding modes and 0–4 decimals.
  - **Integration tests against a real PostgreSQL instance**, never a mock. Triggers, partial unique indexes, views, `ON CONFLICT` lock logic, and `FOR UPDATE` behavior exist only in the database, so only a real instance proves them.
  - **Concurrency tests** that open parallel database connections: simultaneous lock requests, heartbeat versus expiry, and stale-`version` writes.
  - **API tests** generated from the endpoint table in §4, which run every endpoint with every permission combination.
  - **End-to-end browser tests** for the confirmation modal, lock-holder message, timeline and table history, and pre-report filters.
  - **Performance test** with a scripted load against the seeded dataset (grown to 15,000 employees) to check the `NFR-02` targets and review `EXPLAIN` plans for the search and report queries.
  - **Security checks:** dependency vulnerability audit and an OWASP ZAP baseline scan against the locally running stack.
- **Acceptance data.** Seed twice with the same PRNG seed and compare row-level checksums to prove determinism.

---

## 10. Open Technical Boundaries (`TBD`)

- **`TBD-03` — all deployment and infrastructure work.** Everything that depends on where and how the system runs is deferred, including:
  - hosting provider, environments, networking, and TLS termination;
  - CI/CD pipelines and release process;
  - production secrets storage, and encryption of the database and backups;
  - backup schedule, point-in-time recovery, RPO and RTO targets, and restore drills;
  - infrastructure monitoring, log aggregation, alerting, and the support SLA.

  The application is written to run anywhere: it is configured only through environment variables, exposes health endpoints, logs to standard output, and shuts down cleanly.
- **`TBD-01`:** Excel bulk import parser and reconciliation workflow.
- **`TBD-04`:** Commercials, legal sign-off, and the NDA and data processing agreement.

---

## 11. Open Decisions (Client Confirmation Required)

| ID | Decision | Current Specification | Recommendation |
|---|---|---|---|
| OD-01 | OTP validity | 24 hours, as the client stated | Shorten to 10–15 minutes. A 24-hour window for a 6-digit code on payroll data widens the attack surface. `OTP_TTL_MINUTES` makes the change a configuration edit. |
| OD-02 | Meaning of "Waiting on management approval" | The pending row counts as the salary in force and is shown with a badge. No approval action exists in this release. | If the client wants the old salary to stay in force until approval, three things change together: `salary_in_force` filters on `approval_status = 'ACTIVE'`; its "is corrected" check counts only `ACTIVE` corrections (otherwise a pending typo fix would hide the original row and leave no salary in force); and `salary_periods` ignores pending rows when deriving period ends. Either choice must be confirmed before analytics are built. |
| OD-03 | Self-edit | Users with `write` or `edit` may modify any record, including their own (client statement, `FR-AUTH-09`). | Block users from revising their own salary or changing their own permissions. This needs a link between `users` and `employees`. |
| OD-04 | Salary visibility and export | Every user with `read` can see all salaries and download the full filtered dataset as CSV. The audit log is already restricted to the HR Manager because its payloads contain salary values. | Introduce a separate `salary:view` permission so that `read` does not expose compensation, and a separate `export` permission so that bulk download is granted deliberately. |
| OD-05 | HR Manager rights | The HR Manager can invite other HR Managers, and the HR Manager flag implies all four permissions (the `permissions` array is ignored for an HR Manager). | Confirm that this is intended, or define a narrower HR Manager role. |

## 12. Approved architecture addendum — ADR-002

- Add `salary_change_requests` and append-only decision records outside the salary ledger. Submission never creates an authoritative salary row. HR-only approve/reject is an explicit exception to deferred approval workflows; broader management workflows stay excluded.
- Lock the employee/request in a consistent order for submission and decision. Reject duplicate pending employee/date requests. Persist submitted reason, original effective date, expected employee version, country/rounding and FX snapshots. At decision, revalidate active roles, requester/subject separation, employee state/version, date availability and retained conversion basis. Stale requests require corrected resubmission; never silently rebase.
- Approval inserts ledger/history/audit and immutable decision in one transaction. Rejection inserts decision/audit only. Salary-in-force and periods query ledger rows, never unresolved request payloads. Existing approved rows remain untouched. Backdated typo corrections require the same approval gate.
- FX storage uses immutable revisions. Resolve applicable effective dates using the requested historical report date, with recorded-time revision ordering for corrections. Capture rate revision IDs and each conversion leg; snapshot exports never recompute their figures.
- Snapshots carry owner, expiry, invalidation and permission/version context. Every access queries current user/permission state. Removal and permission mutations invalidate affected snapshots transactionally. Old downloaded CSVs cannot be revoked.
- Enforce holds in database triggers as well as backend removal checks. All application roles lack permanent deletion of salary/history; no cascade may bypass protection. Holds have actor/reason/time and audited release.
- Existing raw example DDL must be extended through forward-only migrations. The approved exact-decimal, country-snapshot, lease/version, same-origin session and least-privilege architecture remains.

New traceability IDs: FR-APR-01–05, FR-REF-05, FR-SAL-18, FR-REP-05, FR-EMP-09. Approval APIs/UI and real-database concurrency tests become part of the salary module's definition of done.
