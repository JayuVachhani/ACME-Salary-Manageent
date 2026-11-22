# ACME — database and schema reference

**Purpose:** Inventory every stored table, relationship, field and integrity boundary.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), merged source `8ae97b3b3a1ec70802fc17ca6b97f205d25e9d3b` (PR #5).

## Executive summary

PostgreSQL is authoritative through 14 forward SQL migrations plus the migrator-owned schema_migrations table. The introspected Prisma schema contains all 22 tables; it is not sufficient to recreate checks/triggers/expression indexes. Use decimal strings for numeric data and UUID strings for identifiers. No TTL deletion scheduler or application cascade purge exists. The per-entity appendix below is derived directly from the checked-in Prisma schema and SQL DDL, not from a live database or employee data.

Related: [CONTEXT.md](CONTEXT.md), [WORKFLOW_RULES.md](WORKFLOW_RULES.md), [RBAC.md](RBAC.md), [README.md](README.md).

## Integrity and query rules

- salary_records is the authoritative append-only ledger; salary_history_events and audit_logs retain derived/event attribution, not competing mutable salary masters.
- salary_change_requests proposals and salary_approval_decisions are separate immutable tables. Pending/rejected proposals cannot affect salary selection because they are not ledger rows.
- salary_in_force(date) selects each employee's latest eligible, unsuperseded ledger row by date/created_at/id. It does not filter the ledger approval_status badge. salary_periods uses LEAD effective_from; do not assume an inclusive end date. salary_request_status derives PENDING when no decision exists.
- users.status uses INVITED/ACTIVE/DELETED. Live-email uniqueness excludes DELETED; system identity is unique and protected. employee_id is nullable and only one live user may link an employee. Verification/link-management workflow is not delivered.
- Team list: NOT is_system AND status <> DELETED; offset pagination 20. Auth issue: ACTIVE or nonexpired INVITED, never system. Team mutation: matching live target and team_version; reinvite additionally INVITED.
- Employee/domain lookups require removed_at IS NULL and valid dated assignments. user removal changes access only, not employee/salary rows. Employees have no permanent-delete path, and active holds prohibit soft removal.
- readSalarySnapshot checks owner/current permission/version/invalidated_at/expiry. Snapshot membership drives employee-removal invalidation. There is no library/chat split or document collection.
- login_challenges expires within 15 minutes; attempt cap 3; one unconsumed challenge/user. user_sessions expires on access by configured idle/absolute limits. report_snapshots checks exact created_at + 30 minutes. auth_rate_events has window queries but no physical TTL. These are access rules, not automatic row deletion.
- Most FKs are NO ACTION, retaining attribution. The explicit exception is report_snapshot_employees.snapshot_id ON DELETE CASCADE for snapshot membership only. Do not generalize it to users/employees/ledger.
- Append-only update/delete/truncate protection covers audit, salary requests/decisions/ledger/history, assignments, FX revisions and holds/releases. users forbids permanent deletion/system mutation; employees forbids removal under hold. Runtime role lacks owner/DDL privileges and audit mutation rights.
- SQL status/money checks: country precision/minor units 0..4; rounding HALF_UP/FLOOR/CEIL; employment status ACTIVE/INACTIVE; salary ledger status ACTIVE/WAITING_MANAGEMENT_APPROVAL; decision APPROVED/REJECTED; history INITIAL/REVISION/TYPO_CORRECTION/COUNTRY_TRANSFER/CURRENCY_CHANGE; rate event ISSUE/VERIFY. Request PENDING is derived, not a request.status column.

## Migration map

| Migration | Responsibility |
|---|---|
| 001 | Identity, system actor, immutable audit, restricted role settings |
| 002 | Country/currency/reference, employees/assignments, holds/FX, record locks, report snapshots and invalidation |
| 003 | Immutable requests/decisions/ledger/history, validation, atomic approval constraint, views/function |
| 004 | Atomic salary history/audit and employee version |
| 005 | Assignment version and joining-date history guard |
| 006 | Approval-time currency revalidation/shared lock |
| 007 | OTP challenges and sessions |
| 008 | Auth rate-event table/indexes |
| 009 | Immediate access revocation on user removal |
| 010 | Denied-attempt classification for correct rate counters |
| 011 | Team versions, system/self/continuity guards and audit trigger |
| 012 | Complete before/after team audit snapshots |
| 013 | Department/designation immutable IDs, versions, deletion/truncate protection, audit and active-assignment guards |
| 014 | Department/designation whitespace and 200-character name constraints |

No legacy collection rename, automatic startup migration or down migration exists. Prior applied checksums must remain intact. Proposed future structures such as salary bands/catalogue, lease service extensions, seed datasets or job/storage tables are **planned**, not existing fields. Approve their semantics and write migrations rather than documenting guessed columns as implemented.

## Organization reference protections — migrations 013/014

Department/designation IDs are immutable. Version is initialized to 1 and advanced on every update. Names preserve display casing, are case-insensitively unique across active/inactive entries, are trimmed and bounded to 200 characters. Deactivation retains all historical assignments; new assignments lock/check active references. There is no delete/truncate path. Audits are atomic when the trusted server sets acme.reference_actor in the authenticated transaction; runtime credentials remain a trusted server boundary, not end-user credentials. No legacy row cleanup is performed.

Source: [013_organization_references.sql](../acme-salary-app/database/migrations/013_organization_references.sql).

~~~sql
-- Preserve existing values: reject dirty legacy names instead of silently rewriting them.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM departments WHERE name::text<>trim(name::text)) OR
     EXISTS (SELECT 1 FROM designations WHERE name::text<>trim(name::text)) THEN
    RAISE EXCEPTION 'Reference names need an explicitly reviewed cleanup before migration 013';
  END IF;
END $$;
ALTER TABLE departments ADD CONSTRAINT department_name_normalized CHECK (name::text=trim(name::text));
ALTER TABLE designations ADD CONSTRAINT designation_name_normalized CHECK (name::text=trim(name::text));

CREATE FUNCTION guard_organization_reference() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Deactivate references instead of deleting' USING ERRCODE='55000'; END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.id<>OLD.id THEN RAISE EXCEPTION 'Reference identifiers are immutable' USING ERRCODE='55000'; END IF;
    NEW.version:=OLD.version+1;
  ELSE NEW.version:=1;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER department_guard BEFORE INSERT OR UPDATE OR DELETE ON departments FOR EACH ROW EXECUTE FUNCTION guard_organization_reference();
CREATE TRIGGER designation_guard BEFORE INSERT OR UPDATE OR DELETE ON designations FOR EACH ROW EXECUTE FUNCTION guard_organization_reference();
CREATE TRIGGER department_no_truncate BEFORE TRUNCATE ON departments FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();
CREATE TRIGGER designation_no_truncate BEFORE TRUNCATE ON designations FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();

CREATE FUNCTION validate_assignment_references() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- SHARE conflicts with deactivation UPDATE, including a concurrent transaction.
  PERFORM 1 FROM departments WHERE id=NEW.department_id AND is_active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Department is inactive' USING ERRCODE='23514'; END IF;
  PERFORM 1 FROM designations WHERE id=NEW.designation_id AND is_active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Designation is inactive' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER assignment_reference_check BEFORE INSERT ON employee_assignments FOR EACH ROW EXECUTE FUNCTION validate_assignment_references();

CREATE FUNCTION audit_organization_reference() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor uuid;
BEGIN
  actor:=nullif(current_setting('acme.reference_actor',true),'')::uuid;
  IF actor IS NOT NULL THEN
    INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
    VALUES(actor,upper(TG_TABLE_NAME),NEW.id::text,'REFERENCE_'||TG_OP,'HR reference administration',
      jsonb_build_object('before',CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,'after',to_jsonb(NEW)));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER department_audit AFTER INSERT OR UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION audit_organization_reference();
CREATE TRIGGER designation_audit AFTER INSERT OR UPDATE ON designations FOR EACH ROW EXECUTE FUNCTION audit_organization_reference();
REVOKE ALL ON FUNCTION guard_organization_reference(),validate_assignment_references(),audit_organization_reference() FROM PUBLIC;
~~~

Source: [014_reference_name_bounds.sql](../acme-salary-app/database/migrations/014_reference_name_bounds.sql).

~~~sql
-- Match API whitespace/length checks without rewriting pre-existing reference names.
ALTER TABLE departments ADD CONSTRAINT department_name_bounds
  CHECK (length(name::text)<=200 AND name::text !~ '^[[:space:]]|[[:space:]]$');
ALTER TABLE designations ADD CONSTRAINT designation_name_bounds
  CHECK (length(name::text)<=200 AND name::text !~ '^[[:space:]]|[[:space:]]$');
~~~

## Per-entity reference

Scalar field tables, JSON fragments, FK/index declarations and original SQL constraints follow. Examples are synthetic fragments, not insert-ready fixtures; digests/placeholders must be generated by application code. Relation properties are Prisma navigation fields, not additional SQL columns.


### Tables overview

| Table | Purpose | Mutability / expiration |
|---|---|---|
| audit_logs | Append-only actor-attributed business/security audit. Actor can be null for unrecognized/security events; no HTTP audit browser exists. | Append-only; no row TTL |
| country_rules | Country policy/version and default currency. Policy JSON does not implement legal automation; no administrative API yet. | Mutable access metadata; no row TTL |
| currencies | Three-uppercase-letter codes, precision and active status. This is not a complete ISO catalogue or external provider. | Mutable access metadata; no row TTL |
| departments | Controlled case-insensitive department names; HR administration API/UI delivered in P4a. | Mutable access metadata; no row TTL |
| designations | Controlled case-insensitive designation names; HR administration API/UI delivered in P4a. | Mutable access metadata; no row TTL |
| employee_assignments | Immutable effective-dated country/department/designation/employment status; not a completed transfer workflow. | Append-only; no row TTL |
| employees | Employee identity and removal/version fields. Employment active/inactive status belongs to dated assignments, not this row. | Mutable access metadata; no row TTL |
| fx_rate_revisions | Immutable, sequential pair/date rate revisions with source/reason/creator. No per-entry override or live rate-provider integration. | Append-only; no row TTL |
| record_locks | Edit-lease schema groundwork only; no acquire, heartbeat or release service/API. | Schema only; expires_at is not a cleanup job |
| report_snapshot_employees | Snapshot membership for removal invalidation; generator must populate every relevant employee. | Mutable access metadata; no row TTL |
| report_snapshots | Stored owner-specific report payload, filters/as-of/currency and authorization version. Generation/export APIs are absent. | Mutable access metadata; no row TTL |
| retention_hold_releases | One immutable HR release per hold. Releasing a hold does not itself remove the employee or erase other holds. | Append-only; no row TTL |
| retention_holds | Immutable HR-attributed employee protection; active means no matching release row. | Append-only; no row TTL |
| salary_approval_decisions | One immutable independent APPROVED/REJECTED decision per request; approved decision requires ledger row in the same commit. | Append-only; no row TTL |
| salary_change_requests | Immutable backdated proposals with expected employee version, country policy snapshot and FX provenance. PENDING status is derived. | Append-only; no row TTL |
| salary_history_events | Append-only derived before/after ledger history. updated_by is the ledger creator/requester; independent decision actor remains on decision/audit. | Append-only; no row TTL |
| salary_records | Authoritative append-only monthly salary ledger. Same-date typo corrections link to prior rows; ordinary original dates are unique. | Append-only; no row TTL |
| schema_migrations | Owner-only filename/checksum/applied_at migration registry, created by migrate.mjs. Runtime read is deliberately denied. | Owner-only checksummed registry |
| users | Passwordless identity, HR flag, six granular permissions, invitation/removal and independent team/authorization versions. employee_id nullable and not verified by a delivered workflow. | Mutable access metadata; no row TTL |
| login_challenges | HMAC-only OTP challenge, max three attempts, expiry and consumed timestamp. No plaintext code field. | Mutable access metadata; no row TTL |
| user_sessions | Only keyed session/CSRF digests, current identity FK, activity/revocation times. No JWT or raw token storage. | Mutable access metadata; no row TTL |
| auth_rate_events | Keyed email/IP digests for issuance and verification windows. is_allowed differentiates denied IP activity from accepted issuance quotas. | Mutable access metadata; no row TTL |

## audit_logs

Append-only actor-attributed business/security audit. Actor can be null for unrecognized/security events; no HTTP audit browser exists.

**Application queries:** Audit is written by triggers/services; runtime has SELECT/INSERT only. No public read API. Unknown email identifiers are hashed.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | BigInt (required) | @id @default(autoincrement()) |
| actor_id | String? (nullable) | @db.Uuid |
| entity_type | String (required) | No explicit default/index annotation |
| entity_id | String (required) | No explicit default/index annotation |
| change_type | String (required) | No explicit default/index annotation |
| description | String (required) | No explicit default/index annotation |
| payload | Json (required) | @default("{}") |
| created_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "1",
  "actor_id": null,
  "entity_type": "Synthetic example",
  "entity_id": "Synthetic example",
  "change_type": "SYNTHETIC_EXAMPLE",
  "description": "Synthetic example",
  "payload": {},
  "created_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
users       users?   @relation(fields: [actor_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
@@index([actor_id, created_at(sort: Desc)], map: "audit_actor_idx")
@@index([entity_type, entity_id, created_at(sort: Desc), id(sort: Desc)], map: "audit_entity_idx")
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [001_identity_audit.sql](../acme-salary-app/database/migrations/001_identity_audit.sql).

~~~sql
CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES users(id),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  change_type text NOT NULL,
  description text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
~~~

Source: [001_identity_audit.sql](../acme-salary-app/database/migrations/001_identity_audit.sql).

~~~sql
CREATE INDEX audit_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC, id DESC);
~~~

Source: [001_identity_audit.sql](../acme-salary-app/database/migrations/001_identity_audit.sql).

~~~sql
CREATE INDEX audit_actor_idx ON audit_logs(actor_id, created_at DESC);
~~~

## country_rules

Country policy/version and default currency. Policy JSON does not implement legal automation; no administrative API yet.

**Application queries:** Lookup by dated assignment country; submission captures policy fields; approval compares current version with captured version.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| country_code | String (required) | @id |
| country_name | String (required) | @unique |
| default_currency | String (required) | No explicit default/index annotation |
| decimal_places | Int (required) | @db.SmallInt |
| rounding_mode | String (required) | No explicit default/index annotation |
| retention_policy | Json (required) | @default("{\"mode\": \"KEEP_UNTIL_REMOVED\"}") |
| regulations_meta | Json (required) | @default("{}") |
| is_active | Boolean (required) | @default(true) |
| version | Int (required) | @default(1) |
| updated_by | String (required) | @db.Uuid |
| updated_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "country_code": "ZZ",
  "country_name": "Synthetic Country",
  "default_currency": "USD",
  "decimal_places": 2,
  "rounding_mode": "HALF_UP",
  "retention_policy": {
    "mode": "KEEP_UNTIL_REMOVED"
  },
  "regulations_meta": {},
  "is_active": true,
  "version": 1,
  "updated_by": "00000000-0000-4000-8000-000000000002",
  "updated_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
currencies             currencies               @relation(fields: [default_currency], references: [code], onDelete: NoAction, onUpdate: NoAction)
users                  users                    @relation(fields: [updated_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
employee_assignments   employee_assignments[]
salary_change_requests salary_change_requests[]
salary_records         salary_records[]
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE country_rules (
  country_code text PRIMARY KEY CHECK (country_code ~ '^[A-Z]{2}$'),
  country_name text NOT NULL UNIQUE,
  default_currency text NOT NULL REFERENCES currencies(code),
  decimal_places smallint NOT NULL CHECK (decimal_places BETWEEN 0 AND 4),
  rounding_mode text NOT NULL CHECK (rounding_mode IN ('HALF_UP','FLOOR','CEIL')),
  retention_policy jsonb NOT NULL DEFAULT '{"mode":"KEEP_UNTIL_REMOVED"}'::jsonb,
  regulations_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_by uuid NOT NULL REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
~~~

## currencies

Three-uppercase-letter codes, precision and active status. This is not a complete ISO catalogue or external provider.

**Application queries:** No dedicated HTTP consumer; relation/schema or internal SQL use only. Inspect the source relation and migrations below before adding a consumer.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| code | String (required) | @id |
| minor_units | Int (required) | @db.SmallInt |
| is_active | Boolean (required) | @default(true) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "code": "USD",
  "minor_units": 2,
  "is_active": true
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
country_rules                                                              country_rules[]
fx_rate_revisions_fx_rate_revisions_base_currencyTocurrencies              fx_rate_revisions[]      @relation("fx_rate_revisions_base_currencyTocurrencies")
fx_rate_revisions_fx_rate_revisions_quote_currencyTocurrencies             fx_rate_revisions[]      @relation("fx_rate_revisions_quote_currencyTocurrencies")
report_snapshots                                                           report_snapshots[]
salary_change_requests_salary_change_requests_currencyTocurrencies         salary_change_requests[] @relation("salary_change_requests_currencyTocurrencies")
salary_change_requests_salary_change_requests_default_currencyTocurrencies salary_change_requests[] @relation("salary_change_requests_default_currencyTocurrencies")
salary_records_salary_records_currencyTocurrencies                         salary_records[]         @relation("salary_records_currencyTocurrencies")
salary_records_salary_records_default_currencyTocurrencies                 salary_records[]         @relation("salary_records_default_currencyTocurrencies")
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE currencies (
  code text PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),
  minor_units smallint NOT NULL CHECK (minor_units BETWEEN 0 AND 4),
  is_active boolean NOT NULL DEFAULT true
);
~~~

## departments

Controlled case-insensitive department names; HR administration API/UI delivered in P4a.

**Application queries:** No dedicated HTTP consumer; relation/schema or internal SQL use only. Inspect the source relation and migrations below before adding a consumer.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| name | String (required) | @unique @db.Citext |
| is_active | Boolean (required) | @default(true) |
| version | Int (required) | @default(1) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "name": "Synthetic example",
  "is_active": true,
  "version": 1
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
employee_assignments employee_assignments[]
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL UNIQUE CHECK (length(trim(name::text)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1
);
~~~

## designations

Controlled case-insensitive designation names; HR administration API/UI delivered in P4a.

**Application queries:** No dedicated HTTP consumer; relation/schema or internal SQL use only. Inspect the source relation and migrations below before adding a consumer.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| name | String (required) | @unique @db.Citext |
| is_active | Boolean (required) | @default(true) |
| version | Int (required) | @default(1) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "name": "Synthetic example",
  "is_active": true,
  "version": 1
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
employee_assignments employee_assignments[]
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL UNIQUE CHECK (length(trim(name::text)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1
);
~~~

## employee_assignments

Immutable effective-dated country/department/designation/employment status; not a completed transfer workflow.

**Application queries:** Latest effective_from <= salary effective date, ordered descending; joining-date validation and unique employee/date.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| employee_id | String (required) | @db.Uuid |
| country_code | String (required) | No explicit default/index annotation |
| department_id | String (required) | @db.Uuid |
| designation_id | String (required) | @db.Uuid |
| employment_status | String (required) | No explicit default/index annotation |
| effective_from | DateTime (required) | @db.Date |
| reason | String (required) | No explicit default/index annotation |
| created_by | String (required) | @db.Uuid |
| created_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "employee_id": "00000000-0000-4000-8000-000000000002",
  "country_code": "ZZ",
  "department_id": "00000000-0000-4000-8000-000000000002",
  "designation_id": "00000000-0000-4000-8000-000000000002",
  "employment_status": "ACTIVE",
  "effective_from": "2026-11-22",
  "reason": "Synthetic example",
  "created_by": "00000000-0000-4000-8000-000000000002",
  "created_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
country_rules     country_rules @relation(fields: [country_code], references: [country_code], onDelete: NoAction, onUpdate: NoAction)
users             users         @relation(fields: [created_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
departments       departments   @relation(fields: [department_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
designations      designations  @relation(fields: [designation_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
employees         employees     @relation(fields: [employee_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
@@unique([employee_id, effective_from])
@@index([employee_id, effective_from(sort: Desc)], map: "assignment_employee_date_idx")
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE employee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  country_code text NOT NULL REFERENCES country_rules(country_code),
  department_id uuid NOT NULL REFERENCES departments(id),
  designation_id uuid NOT NULL REFERENCES designations(id),
  employment_status text NOT NULL CHECK (employment_status IN ('ACTIVE','INACTIVE')),
  effective_from date NOT NULL,
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, effective_from)
);
~~~

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE INDEX assignment_employee_date_idx ON employee_assignments(employee_id, effective_from DESC);
~~~

## employees

Employee identity and removal/version fields. Employment active/inactive status belongs to dated assignments, not this row.

**Application queries:** Domain reads use removed_at IS NULL; date >= joining_date; version compared before writes.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| employee_code | String (required) | @unique(map: "employees_code_live_uq", where: raw("(removed_at IS NULL)")) |
| email | String (required) | @unique(map: "employees_email_live_uq", where: raw("(removed_at IS NULL)")) @db.Citext |
| first_name | String (required) | No explicit default/index annotation |
| last_name | String (required) | No explicit default/index annotation |
| joining_date | DateTime (required) | @db.Date |
| removed_at | DateTime? (nullable) | @db.Timestamptz(6) |
| version | Int (required) | @default(1) |
| created_by | String (required) | @db.Uuid |
| created_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |
| updated_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "employee_code": "SYN-001",
  "email": "synthetic.member@acme.test",
  "first_name": "Synthetic example",
  "last_name": "Synthetic example",
  "joining_date": "2026-01-01",
  "removed_at": null,
  "version": 1,
  "created_by": "00000000-0000-4000-8000-000000000002",
  "created_at": "2026-11-22T00:00:00Z",
  "updated_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
employee_assignments               employee_assignments[]
users_employees_created_byTousers  users                       @relation("employees_created_byTousers", fields: [created_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
record_locks                       record_locks?
report_snapshot_employees          report_snapshot_employees[]
retention_holds                    retention_holds[]
salary_change_requests             salary_change_requests[]
salary_history_events              salary_history_events[]
salary_records                     salary_records[]
users_users_employee_idToemployees users?                      @relation("users_employee_idToemployees")
@@index([employee_code(ops: raw("gin_trgm_ops"))], map: "employees_code_trgm", type: Gin)
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text NOT NULL CHECK (employee_code = upper(trim(employee_code)) AND length(employee_code) > 0),
  email citext NOT NULL CHECK (email::text = trim(email::text)),
  first_name text NOT NULL CHECK (length(trim(first_name)) > 0),
  last_name text NOT NULL CHECK (length(trim(last_name)) > 0),
  joining_date date NOT NULL,
  removed_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
~~~

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE UNIQUE INDEX employees_code_live_uq ON employees(employee_code) WHERE removed_at IS NULL;
~~~

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE UNIQUE INDEX employees_email_live_uq ON employees(email) WHERE removed_at IS NULL;
~~~

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE INDEX employees_name_trgm ON employees USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
~~~

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE INDEX employees_code_trgm ON employees USING gin (employee_code gin_trgm_ops);
~~~

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE INDEX employees_email_trgm ON employees USING gin ((email::text) gin_trgm_ops);
~~~

## fx_rate_revisions

Immutable, sequential pair/date rate revisions with source/reason/creator. No per-entry override or live rate-provider integration.

**Application queries:** Pair/as-of/staleness window then effective_date DESC, revision DESC. Conversion tries direct/inverse/USD.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| base_currency | String (required) | No explicit default/index annotation |
| quote_currency | String (required) | No explicit default/index annotation |
| effective_date | DateTime (required) | @db.Date |
| revision | Int (required) | No explicit default/index annotation |
| rate | Decimal (required) | @db.Decimal(18, 8) |
| source | String (required) | No explicit default/index annotation |
| reason | String (required) | No explicit default/index annotation |
| created_by | String (required) | @db.Uuid |
| recorded_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "base_currency": "USD",
  "quote_currency": "EUR",
  "effective_date": "2026-11-22",
  "revision": 1,
  "rate": "1.00000000",
  "source": "Synthetic example",
  "reason": "Synthetic example",
  "created_by": "00000000-0000-4000-8000-000000000002",
  "recorded_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
currencies_fx_rate_revisions_base_currencyTocurrencies  currencies @relation("fx_rate_revisions_base_currencyTocurrencies", fields: [base_currency], references: [code], onDelete: NoAction, onUpdate: NoAction)
users                                                   users      @relation(fields: [created_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
currencies_fx_rate_revisions_quote_currencyTocurrencies currencies @relation("fx_rate_revisions_quote_currencyTocurrencies", fields: [quote_currency], references: [code], onDelete: NoAction, onUpdate: NoAction)
@@unique([base_currency, quote_currency, effective_date, revision])
@@index([base_currency, quote_currency, effective_date(sort: Desc), revision(sort: Desc)], map: "fx_lookup_idx")
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE fx_rate_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL REFERENCES currencies(code),
  quote_currency text NOT NULL REFERENCES currencies(code),
  effective_date date NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  rate numeric(18,8) NOT NULL CHECK (rate > 0),
  source text NOT NULL CHECK (length(trim(source)) > 0),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  created_by uuid NOT NULL REFERENCES users(id),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CHECK (base_currency <> quote_currency),
  UNIQUE(base_currency,quote_currency,effective_date,revision)
);
~~~

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE INDEX fx_lookup_idx ON fx_rate_revisions(base_currency,quote_currency,effective_date DESC,revision DESC);
~~~

## record_locks

Edit-lease schema groundwork only; no acquire, heartbeat or release service/API.

Any timestamp in the synthetic example is illustrative. No operational lease lifetime has been configured by this table or an application service; do not adopt the example interval as an approved business rule.

**Application queries:** No dedicated HTTP consumer; relation/schema or internal SQL use only. Inspect the source relation and migrations below before adding a consumer.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| employee_id | String (required) | @id @db.Uuid |
| locked_by | String (required) | @db.Uuid |
| token_hash | String (required) | No explicit default/index annotation |
| locked_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |
| expires_at | DateTime (required) | @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "employee_id": "00000000-0000-4000-8000-000000000002",
  "locked_by": "00000000-0000-4000-8000-000000000002",
  "token_hash": "<application-generated-digest>",
  "locked_at": "2026-11-22T00:00:00Z",
  "expires_at": "2026-11-22T00:15:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
employees   employees @relation(fields: [employee_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
users       users     @relation(fields: [locked_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE record_locks (
  employee_id uuid PRIMARY KEY REFERENCES employees(id),
  locked_by uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
~~~

## report_snapshot_employees

Snapshot membership for removal invalidation; generator must populate every relevant employee.

**Application queries:** Membership joins snapshot to removed employee for invalidation; only this FK cascades on snapshot deletion.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| snapshot_id | String (required) | @db.Uuid |
| employee_id | String (required) | @db.Uuid |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "snapshot_id": "00000000-0000-4000-8000-000000000002",
  "employee_id": "00000000-0000-4000-8000-000000000002"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
employees        employees        @relation(fields: [employee_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
report_snapshots report_snapshots @relation(fields: [snapshot_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
@@id([snapshot_id, employee_id])
@@index([employee_id, snapshot_id], map: "snapshot_employee_idx")
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE report_snapshot_employees (
  snapshot_id uuid NOT NULL REFERENCES report_snapshots(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id),
  PRIMARY KEY(snapshot_id,employee_id)
);
~~~

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE INDEX snapshot_employee_idx ON report_snapshot_employees(employee_id,snapshot_id);
~~~

## report_snapshots

Stored owner-specific report payload, filters/as-of/currency and authorization version. Generation/export APIs are absent.

**Application queries:** ID + owner_id + current authorization_version + invalidated_at IS NULL + expires_at > now; fresh rights checked first.

**Expiration/retention:** expires_at must equal created_at +30 minutes; no automatic deletion.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| owner_id | String (required) | @db.Uuid |
| authorization_version | Int (required) | No explicit default/index annotation |
| as_of | DateTime (required) | @db.Date |
| target_currency | String (required) | No explicit default/index annotation |
| filters | Json (required) | No explicit default/index annotation |
| payload | Json (required) | No explicit default/index annotation |
| created_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |
| expires_at | DateTime (required) | @db.Timestamptz(6) |
| invalidated_at | DateTime? (nullable) | @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "owner_id": "00000000-0000-4000-8000-000000000002",
  "authorization_version": 1,
  "as_of": "2026-11-22",
  "target_currency": "USD",
  "filters": {},
  "payload": {},
  "created_at": "2026-11-22T00:00:00Z",
  "expires_at": "2026-11-22T00:30:00Z",
  "invalidated_at": null
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
report_snapshot_employees report_snapshot_employees[]
users                     users                       @relation(fields: [owner_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
currencies                currencies                  @relation(fields: [target_currency], references: [code], onDelete: NoAction, onUpdate: NoAction)
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE report_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id),
  authorization_version integer NOT NULL,
  as_of date NOT NULL,
  target_currency text NOT NULL REFERENCES currencies(code),
  filters jsonb NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  invalidated_at timestamptz,
  CHECK (expires_at = created_at + interval '30 minutes')
);
~~~

## retention_hold_releases

One immutable HR release per hold. Releasing a hold does not itself remove the employee or erase other holds.

**Application queries:** hold_id unique/PK; no delete or update; release requires available employee and active HR.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| hold_id | String (required) | @id @db.Uuid |
| reason | String (required) | No explicit default/index annotation |
| released_by | String (required) | @db.Uuid |
| released_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "hold_id": "00000000-0000-4000-8000-000000000002",
  "reason": "Synthetic example",
  "released_by": "00000000-0000-4000-8000-000000000002",
  "released_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
retention_holds retention_holds @relation(fields: [hold_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
users           users           @relation(fields: [released_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE retention_hold_releases (
  hold_id uuid PRIMARY KEY REFERENCES retention_holds(id),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  released_by uuid NOT NULL REFERENCES users(id),
  released_at timestamptz NOT NULL DEFAULT now()
);
~~~

## retention_holds

Immutable HR-attributed employee protection; active means no matching release row.

**Application queries:** Employee has an active hold when no retention_hold_releases row matches hold id.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| employee_id | String (required) | @db.Uuid |
| reason | String (required) | No explicit default/index annotation |
| placed_by | String (required) | @db.Uuid |
| placed_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "employee_id": "00000000-0000-4000-8000-000000000002",
  "reason": "Synthetic example",
  "placed_by": "00000000-0000-4000-8000-000000000002",
  "placed_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
retention_hold_releases retention_hold_releases?
employees               employees                @relation(fields: [employee_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
users                   users                    @relation(fields: [placed_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
@@index([employee_id], map: "holds_employee_idx")
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE TABLE retention_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  placed_by uuid NOT NULL REFERENCES users(id),
  placed_at timestamptz NOT NULL DEFAULT now()
);
~~~

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
CREATE INDEX holds_employee_idx ON retention_holds(employee_id);
~~~

## salary_approval_decisions

One immutable independent APPROVED/REJECTED decision per request; approved decision requires ledger row in the same commit.

**Application queries:** request_id primary key allows one final decision; approval checks expected employee version and active currency.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| request_id | String (required) | @id @db.Uuid |
| decision | String (required) | No explicit default/index annotation |
| decided_by | String (required) | @db.Uuid |
| comment | String (required) | No explicit default/index annotation |
| decided_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "request_id": "00000000-0000-4000-8000-000000000002",
  "decision": "REJECTED",
  "decided_by": "00000000-0000-4000-8000-000000000002",
  "comment": "Synthetic example",
  "decided_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
users                  users                  @relation(fields: [decided_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
salary_change_requests salary_change_requests @relation(fields: [request_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql).

~~~sql
CREATE TABLE salary_approval_decisions (
  request_id uuid PRIMARY KEY REFERENCES salary_change_requests(id),
  decision text NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
  decided_by uuid NOT NULL REFERENCES users(id),
  comment text NOT NULL CHECK (length(trim(comment)) > 0),
  decided_at timestamptz NOT NULL DEFAULT now()
);
~~~

## salary_change_requests

Immutable backdated proposals with expected employee version, country policy snapshot and FX provenance. PENDING status is derived.

**Application queries:** Duplicate pending check uses no matching salary_approval_decisions for employee/date. No mutable status column.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| employee_id | String (required) | @db.Uuid |
| requested_by | String (required) | @db.Uuid |
| submitted_business_date | DateTime (required) | @db.Date |
| effective_from | DateTime (required) | @db.Date |
| expected_employee_version | Int (required) | No explicit default/index annotation |
| monthly_amount | Decimal (required) | @db.Decimal(18, 4) |
| currency | String (required) | No explicit default/index annotation |
| country_code | String (required) | No explicit default/index annotation |
| default_currency | String (required) | No explicit default/index annotation |
| country_rule_version | Int (required) | No explicit default/index annotation |
| decimal_places | Int (required) | @db.SmallInt |
| rounding_mode | String (required) | No explicit default/index annotation |
| corrects_id | String? (nullable) | @db.Uuid |
| reason | String (required) | No explicit default/index annotation |
| conversion_meta | Json (required) | @default("{}") |
| created_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "employee_id": "00000000-0000-4000-8000-000000000002",
  "requested_by": "00000000-0000-4000-8000-000000000002",
  "submitted_business_date": "2026-11-22",
  "effective_from": "2026-11-01",
  "expected_employee_version": 1,
  "monthly_amount": "1000.0000",
  "currency": "USD",
  "country_code": "ZZ",
  "default_currency": "USD",
  "country_rule_version": 1,
  "decimal_places": 2,
  "rounding_mode": "HALF_UP",
  "corrects_id": null,
  "reason": "Synthetic example",
  "conversion_meta": {},
  "created_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
salary_approval_decisions                                                 salary_approval_decisions?
salary_records_salary_change_requests_corrects_idTosalary_records         salary_records?            @relation("salary_change_requests_corrects_idTosalary_records", fields: [corrects_id], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "request_correction_fk")
country_rules                                                             country_rules              @relation(fields: [country_code], references: [country_code], onDelete: NoAction, onUpdate: NoAction)
currencies_salary_change_requests_currencyTocurrencies                    currencies                 @relation("salary_change_requests_currencyTocurrencies", fields: [currency], references: [code], onDelete: NoAction, onUpdate: NoAction)
currencies_salary_change_requests_default_currencyTocurrencies            currencies                 @relation("salary_change_requests_default_currencyTocurrencies", fields: [default_currency], references: [code], onDelete: NoAction, onUpdate: NoAction)
employees                                                                 employees                  @relation(fields: [employee_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
users                                                                     users                      @relation(fields: [requested_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
salary_records_salary_records_approval_request_idTosalary_change_requests salary_records?            @relation("salary_records_approval_request_idTosalary_change_requests")
@@index([employee_id, effective_from], map: "requests_employee_date_idx")
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql).

~~~sql
CREATE TABLE salary_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  requested_by uuid NOT NULL REFERENCES users(id),
  submitted_business_date date NOT NULL,
  effective_from date NOT NULL,
  expected_employee_version integer NOT NULL CHECK (expected_employee_version > 0),
  monthly_amount numeric(18,4) NOT NULL CHECK (monthly_amount > 0),
  currency text NOT NULL REFERENCES currencies(code),
  country_code text NOT NULL REFERENCES country_rules(country_code),
  default_currency text NOT NULL REFERENCES currencies(code),
  country_rule_version integer NOT NULL,
  decimal_places smallint NOT NULL CHECK (decimal_places BETWEEN 0 AND 4),
  rounding_mode text NOT NULL CHECK (rounding_mode IN ('HALF_UP','FLOOR','CEIL')),
  corrects_id uuid,
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  conversion_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_from < submitted_business_date),
  CHECK (monthly_amount=trunc(monthly_amount,decimal_places))
);
~~~

Source: [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql).

~~~sql
ALTER TABLE salary_change_requests ADD CONSTRAINT request_correction_fk FOREIGN KEY(corrects_id) REFERENCES salary_records(id);
~~~

Source: [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql).

~~~sql
CREATE INDEX requests_employee_date_idx ON salary_change_requests(employee_id,effective_from);
~~~

## salary_history_events

Append-only derived before/after ledger history. updated_by is the ledger creator/requester; independent decision actor remains on decision/audit.

**Application queries:** No dedicated HTTP consumer; relation/schema or internal SQL use only. Inspect the source relation and migrations below before adding a consumer.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| employee_id | String (required) | @db.Uuid |
| salary_record_id | String (required) | @db.Uuid |
| change_type | String (required) | No explicit default/index annotation |
| description | String (required) | No explicit default/index annotation |
| before_state | Json? (nullable) | No explicit default/index annotation |
| after_state | Json (required) | No explicit default/index annotation |
| updated_by | String (required) | @db.Uuid |
| updated_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "employee_id": "00000000-0000-4000-8000-000000000002",
  "salary_record_id": "00000000-0000-4000-8000-000000000002",
  "change_type": "INITIAL",
  "description": "Synthetic example",
  "before_state": null,
  "after_state": {},
  "updated_by": "00000000-0000-4000-8000-000000000002",
  "updated_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
employees        employees      @relation(fields: [employee_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
salary_records   salary_records @relation(fields: [salary_record_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
users            users          @relation(fields: [updated_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql).

~~~sql
CREATE TABLE salary_history_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  salary_record_id uuid NOT NULL REFERENCES salary_records(id),
  change_type text NOT NULL CHECK(change_type IN ('INITIAL','REVISION','TYPO_CORRECTION','COUNTRY_TRANSFER','CURRENCY_CHANGE')),
  description text NOT NULL,
  before_state jsonb,
  after_state jsonb NOT NULL,
  updated_by uuid NOT NULL REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
~~~

## salary_records

Authoritative append-only monthly salary ledger. Same-date typo corrections link to prior rows; ordinary original dates are unique.

**Application queries:** salary_in_force selects latest eligible unsuperseded row, not a status badge filter. Corrections use NOT EXISTS child.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| employee_id | String (required) | @db.Uuid |
| corrects_id | String? (nullable) | @unique(map: "salary_correction_uq", where: raw("(corrects_id IS NOT NULL)")) @db.Uuid |
| approval_request_id | String? (nullable) | @unique @db.Uuid |
| monthly_amount | Decimal (required) | @db.Decimal(18, 4) |
| currency | String (required) | No explicit default/index annotation |
| country_code | String (required) | No explicit default/index annotation |
| default_currency | String (required) | No explicit default/index annotation |
| country_rule_version | Int (required) | No explicit default/index annotation |
| decimal_places | Int (required) | @db.SmallInt |
| rounding_mode | String (required) | No explicit default/index annotation |
| effective_from | DateTime (required) | @db.Date |
| submitted_business_date | DateTime (required) | @db.Date |
| approval_status | String (required) | No explicit default/index annotation |
| change_reason | String (required) | No explicit default/index annotation |
| conversion_meta | Json (required) | @default("{}") |
| created_by | String (required) | @db.Uuid |
| created_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "employee_id": "00000000-0000-4000-8000-000000000002",
  "corrects_id": null,
  "approval_request_id": null,
  "monthly_amount": "1000.0000",
  "currency": "USD",
  "country_code": "ZZ",
  "default_currency": "USD",
  "country_rule_version": 1,
  "decimal_places": 2,
  "rounding_mode": "HALF_UP",
  "effective_from": "2026-11-22",
  "submitted_business_date": "2026-11-22",
  "approval_status": "ACTIVE",
  "change_reason": "Synthetic example",
  "conversion_meta": {},
  "created_by": "00000000-0000-4000-8000-000000000002",
  "created_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
salary_change_requests_salary_change_requests_corrects_idTosalary_records         salary_change_requests[] @relation("salary_change_requests_corrects_idTosalary_records")
salary_history_events                                                             salary_history_events[]
salary_change_requests_salary_records_approval_request_idTosalary_change_requests salary_change_requests?  @relation("salary_records_approval_request_idTosalary_change_requests", fields: [approval_request_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
salary_records                                                                    salary_records?          @relation("salary_recordsTosalary_records", fields: [corrects_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
other_salary_records                                                              salary_records?          @relation("salary_recordsTosalary_records")
country_rules                                                                     country_rules            @relation(fields: [country_code], references: [country_code], onDelete: NoAction, onUpdate: NoAction)
users                                                                             users                    @relation(fields: [created_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
currencies_salary_records_currencyTocurrencies                                    currencies               @relation("salary_records_currencyTocurrencies", fields: [currency], references: [code], onDelete: NoAction, onUpdate: NoAction)
currencies_salary_records_default_currencyTocurrencies                            currencies               @relation("salary_records_default_currencyTocurrencies", fields: [default_currency], references: [code], onDelete: NoAction, onUpdate: NoAction)
employees                                                                         employees                @relation(fields: [employee_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
@@unique([employee_id, effective_from], map: "salary_original_date_uq", where: raw("(corrects_id IS NULL)"))
@@index([employee_id, effective_from(sort: Desc)], map: "salary_employee_date_idx")
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql).

~~~sql
CREATE TABLE salary_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  corrects_id uuid REFERENCES salary_records(id),
  approval_request_id uuid UNIQUE REFERENCES salary_change_requests(id),
  monthly_amount numeric(18,4) NOT NULL CHECK (monthly_amount > 0),
  currency text NOT NULL REFERENCES currencies(code),
  country_code text NOT NULL REFERENCES country_rules(country_code),
  default_currency text NOT NULL REFERENCES currencies(code),
  country_rule_version integer NOT NULL,
  decimal_places smallint NOT NULL CHECK (decimal_places BETWEEN 0 AND 4),
  rounding_mode text NOT NULL CHECK (rounding_mode IN ('HALF_UP','FLOOR','CEIL')),
  effective_from date NOT NULL,
  submitted_business_date date NOT NULL,
  approval_status text NOT NULL CHECK (approval_status IN ('ACTIVE','WAITING_MANAGEMENT_APPROVAL')),
  change_reason text NOT NULL CHECK (length(trim(change_reason)) > 0),
  conversion_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (monthly_amount=trunc(monthly_amount,decimal_places))
);
~~~

Source: [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql).

~~~sql
CREATE UNIQUE INDEX salary_original_date_uq ON salary_records(employee_id,effective_from) WHERE corrects_id IS NULL;
~~~

Source: [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql).

~~~sql
CREATE UNIQUE INDEX salary_correction_uq ON salary_records(corrects_id) WHERE corrects_id IS NOT NULL;
~~~

Source: [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql).

~~~sql
CREATE INDEX salary_employee_date_idx ON salary_records(employee_id,effective_from DESC);
~~~

## schema_migrations

Owner-only filename/checksum/applied_at migration registry, created by migrate.mjs. Runtime read is deliberately denied.

**Application queries:** SELECT checksum WHERE name using migration owner only; mismatch aborts further migration.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| name | String (required) | @id |
| checksum | String (required) | No explicit default/index annotation |
| applied_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "name": "001_identity_audit.sql",
  "checksum": "<application-generated-digest>",
  "applied_at": "2026-11-22T00:00:00Z"
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
// Scalar primary/unique fields are annotated in the field glossary; no navigation/index block.
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [scripts/migrate.mjs](../acme-salary-app/scripts/migrate.mjs).

~~~sql
CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());
~~~

## users

Passwordless identity, HR flag, six granular permissions, invitation/removal and independent team/authorization versions. employee_id nullable and not verified by a delivered workflow.

**Application queries:** Auth selects ACTIVE or unexpired INVITED, excluding system; Team selects NOT is_system AND status<>'DELETED'. Mutations compare team_version.

**Expiration/retention:** No table TTL or cleanup worker is implemented.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| email | String (required) | @unique(map: "users_live_email_uq", where: raw("(status <> 'DELETED'::text)")) @db.Citext |
| full_name | String (required) | No explicit default/index annotation |
| is_hr_manager | Boolean (required) | @default(false) |
| permissions | String[] (required) | @default(["read"]) |
| status | String (required) | No explicit default/index annotation |
| employee_id | String? (nullable) | @unique(map: "users_employee_link_uq", where: raw("((status <> 'DELETED'::text) AND (employee_id IS NOT NULL))")) @db.Uuid |
| invited_by | String? (nullable) | @db.Uuid |
| invite_expires_at | DateTime? (nullable) | @db.Timestamptz(6) |
| is_system | Boolean (required) | @unique(map: "users_one_system_uq", where: raw("is_system")) @default(false) |
| deleted_at | DateTime? (nullable) | @db.Timestamptz(6) |
| created_at | DateTime (required) | @default(now()) @db.Timestamptz(6) |
| authorization_version | Int (required) | @default(1) |
| team_version | Int (required) | @default(1) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "email": "synthetic.member@acme.test",
  "full_name": "Synthetic example",
  "is_hr_manager": false,
  "permissions": [
    "read"
  ],
  "status": "ACTIVE",
  "employee_id": null,
  "invited_by": null,
  "invite_expires_at": null,
  "is_system": false,
  "deleted_at": null,
  "created_at": "2026-11-22T00:00:00Z",
  "authorization_version": 1,
  "team_version": 1
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
audit_logs                             audit_logs[]
country_rules                          country_rules[]
employee_assignments                   employee_assignments[]
employees_employees_created_byTousers  employees[]                 @relation("employees_created_byTousers")
fx_rate_revisions                      fx_rate_revisions[]
login_challenges                       login_challenges?
record_locks                           record_locks[]
report_snapshots                       report_snapshots[]
retention_hold_releases                retention_hold_releases[]
retention_holds                        retention_holds[]
salary_approval_decisions              salary_approval_decisions[]
salary_change_requests                 salary_change_requests[]
salary_history_events                  salary_history_events[]
salary_records                         salary_records[]
user_sessions                          user_sessions[]
employees_users_employee_idToemployees employees?                  @relation("users_employee_idToemployees", fields: [employee_id], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "users_employee_fk")
users                                  users?                      @relation("usersTousers", fields: [invited_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
other_users                            users[]                     @relation("usersTousers")
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [001_identity_audit.sql](../acme-salary-app/database/migrations/001_identity_audit.sql).

~~~sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL,
  full_name text NOT NULL CHECK (length(trim(full_name)) > 0),
  is_hr_manager boolean NOT NULL DEFAULT false,
  permissions text[] NOT NULL DEFAULT ARRAY['read'],
  status text NOT NULL CHECK (status IN ('INVITED','ACTIVE','DELETED')),
  employee_id uuid,
  invited_by uuid REFERENCES users(id),
  invite_expires_at timestamptz,
  is_system boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (permissions <@ ARRAY['read','write','edit','delete','salary:view','export']),
  CHECK ((status = 'DELETED') = (deleted_at IS NOT NULL)),
  CHECK (NOT is_system OR (status = 'ACTIVE' AND NOT is_hr_manager AND cardinality(permissions) = 0))
);
~~~

Source: [001_identity_audit.sql](../acme-salary-app/database/migrations/001_identity_audit.sql).

~~~sql
CREATE UNIQUE INDEX users_live_email_uq ON users(email) WHERE status <> 'DELETED';
~~~

Source: [001_identity_audit.sql](../acme-salary-app/database/migrations/001_identity_audit.sql).

~~~sql
CREATE UNIQUE INDEX users_one_system_uq ON users(is_system) WHERE is_system;
~~~

Source: [001_identity_audit.sql](../acme-salary-app/database/migrations/001_identity_audit.sql).

~~~sql
CREATE UNIQUE INDEX users_employee_link_uq ON users(employee_id) WHERE status <> 'DELETED' AND employee_id IS NOT NULL;
~~~

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
ALTER TABLE users ADD CONSTRAINT users_employee_fk FOREIGN KEY (employee_id) REFERENCES employees(id);
~~~

Source: [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql).

~~~sql
ALTER TABLE users ADD COLUMN authorization_version integer NOT NULL DEFAULT 1;
~~~

Source: [011_team_integrity.sql](../acme-salary-app/database/migrations/011_team_integrity.sql).

~~~sql
ALTER TABLE users ADD COLUMN team_version integer NOT NULL DEFAULT 1 CHECK(team_version > 0);
~~~

## login_challenges

HMAC-only OTP challenge, max three attempts, expiry and consumed timestamp. No plaintext code field.

**Application queries:** Verify by ID under lock, then reject consumed/expired/attempts>=3; resend consumes prior open rows for user.

**Expiration/retention:** Maximum 15-minute access lifetime; no automatic deletion.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | String (required) | @id @db.Uuid |
| user_id | String (required) | @unique(map: "login_challenge_live_user", where: raw("(consumed_at IS NULL)")) @db.Uuid |
| secret_hash | String (required) | No explicit default/index annotation |
| attempts | Int (required) | @default(0) |
| created_at | DateTime (required) | @db.Timestamptz(6) |
| expires_at | DateTime (required) | @db.Timestamptz(6) |
| consumed_at | DateTime? (nullable) | @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "user_id": "00000000-0000-4000-8000-000000000002",
  "secret_hash": "<application-generated-digest>",
  "attempts": 0,
  "created_at": "2026-11-22T00:00:00Z",
  "expires_at": "2026-11-22T00:15:00Z",
  "consumed_at": null
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
users       users     @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [007_authentication.sql](../acme-salary-app/database/migrations/007_authentication.sql).

~~~sql
CREATE TABLE login_challenges (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  secret_hash text NOT NULL CHECK (secret_hash ~ '^[a-f0-9]{64}$'),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '15 minutes')
);
~~~

Source: [007_authentication.sql](../acme-salary-app/database/migrations/007_authentication.sql).

~~~sql
CREATE UNIQUE INDEX login_challenge_live_user ON login_challenges(user_id) WHERE consumed_at IS NULL;
~~~

## user_sessions

Only keyed session/CSRF digests, current identity FK, activity/revocation times. No JWT or raw token storage.

**Application queries:** Lookup token_hash, lock identity then session, reject revoked/non-ACTIVE/system/idle/absolute expiry; CSRF checked for mutations.

**Expiration/retention:** Server idle <=30 minutes and absolute <=12 hours; revocation checked at access; no automatic deletion.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| token_hash | String (required) | @id |
| user_id | String (required) | @db.Uuid |
| csrf_hash | String (required) | No explicit default/index annotation |
| created_at | DateTime (required) | @db.Timestamptz(6) |
| last_seen_at | DateTime (required) | @db.Timestamptz(6) |
| revoked_at | DateTime? (nullable) | @db.Timestamptz(6) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "token_hash": "<application-generated-digest>",
  "user_id": "00000000-0000-4000-8000-000000000002",
  "csrf_hash": "<application-generated-digest>",
  "created_at": "2026-11-22T00:00:00Z",
  "last_seen_at": "2026-11-22T00:00:00Z",
  "revoked_at": null
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
users        users     @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
@@index([user_id], map: "user_sessions_user")
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [007_authentication.sql](../acme-salary-app/database/migrations/007_authentication.sql).

~~~sql
CREATE TABLE user_sessions (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid NOT NULL REFERENCES users(id),
  csrf_hash text NOT NULL CHECK (csrf_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (last_seen_at >= created_at)
);
~~~

Source: [007_authentication.sql](../acme-salary-app/database/migrations/007_authentication.sql).

~~~sql
CREATE INDEX user_sessions_user ON user_sessions(user_id);
~~~

## auth_rate_events

Keyed email/IP digests for issuance and verification windows. is_allowed differentiates denied IP activity from accepted issuance quotas.

**Application queries:** created_at within one hour, with per-IP ten-minute filter; accepted ISSUE rows feed email/pair counters; all attempts feed IP counter.

**Expiration/retention:** One-hour/ten-minute windows; no pruning/TTL worker.

### Field glossary

| Column | Prisma scalar / nullable | Exact attributes / defaults |
|---|---|---|
| id | BigInt (required) | @id @default(autoincrement()) |
| email_hash | String (required) | No explicit default/index annotation |
| ip_hash | String (required) | No explicit default/index annotation |
| action | String (required) | No explicit default/index annotation |
| created_at | DateTime (required) | @default(dbgenerated("clock_timestamp()")) @db.Timestamptz(6) |
| is_allowed | Boolean (required) | @default(true) |

Decimal maps to PostgreSQL numeric, DateTime to its shown native date/timestamptz, UUID/Citext to shown native String annotations; unannotated Int is integer, BigInt bigint, Boolean boolean, Json jsonb and String text. Square brackets denote a PostgreSQL scalar array. Relation properties are not columns.

### Synthetic stored-row fragment

~~~json
{
  "id": "1",
  "email_hash": "<application-generated-digest>",
  "ip_hash": "<application-generated-digest>",
  "action": "ISSUE",
  "created_at": "2026-11-22T00:00:00Z",
  "is_allowed": true
}
~~~

### Relationships and indexes

All shown onDelete: NoAction relations retain referenced identity/history. An explicit Cascade is limited to snapshot membership. Partial unique predicates are essential, not optional ORM hints.

~~~prisma
@@index([email_hash, created_at], map: "auth_rate_email")
@@index([ip_hash, created_at], map: "auth_rate_ip")
~~~

### Source SQL constraints and changes

The following DDL is reference material, not a script to rerun. Later function replacements and triggers remain authoritative; full schema creation is migrate.mjs only.

Source: [008_auth_rate_limits.sql](../acme-salary-app/database/migrations/008_auth_rate_limits.sql).

~~~sql
CREATE TABLE auth_rate_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email_hash text NOT NULL,
  ip_hash text NOT NULL,
  action text NOT NULL CHECK (action IN ('ISSUE','VERIFY')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
~~~

Source: [008_auth_rate_limits.sql](../acme-salary-app/database/migrations/008_auth_rate_limits.sql).

~~~sql
CREATE INDEX auth_rate_email ON auth_rate_events(email_hash,created_at);
~~~

Source: [008_auth_rate_limits.sql](../acme-salary-app/database/migrations/008_auth_rate_limits.sql).

~~~sql
CREATE INDEX auth_rate_ip ON auth_rate_events(ip_hash,created_at);
~~~

Source: [010_auth_rate_denials.sql](../acme-salary-app/database/migrations/010_auth_rate_denials.sql).

~~~sql
ALTER TABLE auth_rate_events ADD COLUMN is_allowed boolean NOT NULL DEFAULT true;
~~~

## SQL views and query function

Source: [migration 003](../acme-salary-app/database/migrations/003_salary_approval.sql). These objects are not extra Prisma tables and have no public routes.

~~~sql
CREATE FUNCTION salary_in_force(as_of date) RETURNS SETOF salary_records LANGUAGE sql STABLE AS $$
  SELECT DISTINCT ON (s.employee_id) s.* FROM salary_records s
  WHERE s.effective_from<=as_of AND NOT EXISTS(SELECT 1 FROM salary_records c WHERE c.corrects_id=s.id)
  ORDER BY s.employee_id,s.effective_from DESC,s.created_at DESC,s.id
$$;
~~~

~~~sql
CREATE VIEW salary_periods AS SELECT s.*,
  lead(effective_from) OVER(PARTITION BY employee_id ORDER BY effective_from) AS effective_to
  FROM salary_records s WHERE NOT EXISTS(SELECT 1 FROM salary_records c WHERE c.corrects_id=s.id);
~~~

~~~sql
CREATE VIEW salary_request_status AS SELECT r.*,coalesce(d.decision,'PENDING') AS status,
  d.decided_by,d.comment AS decision_comment,d.decided_at
  FROM salary_change_requests r LEFT JOIN salary_approval_decisions d ON d.request_id=r.id;
~~~

## Trigger and function source map

Later CREATE OR REPLACE definitions supersede earlier function bodies. This list points to the final definition per named function; trigger wiring also remains in the original migration. Database triggers are not scheduled jobs.

| Function | Final source |
|---|---|
| guard_organization_reference | [013_organization_references.sql](../acme-salary-app/database/migrations/013_organization_references.sql) |
| validate_assignment_references | [013_organization_references.sql](../acme-salary-app/database/migrations/013_organization_references.sql) |
| audit_organization_reference | [013_organization_references.sql](../acme-salary-app/database/migrations/013_organization_references.sql) |
| advance_assignment_version | [005_assignment_version_guard.sql](../acme-salary-app/database/migrations/005_assignment_version_guard.sql) |
| audit_fx_revision | [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql) |
| audit_hold_event | [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql) |
| audit_salary_approval | [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql) |
| audit_team_identity | [012_team_audit_snapshots.sql](../acme-salary-app/database/migrations/012_team_audit_snapshots.sql) |
| block_immutable_change | [001_identity_audit.sql](../acme-salary-app/database/migrations/001_identity_audit.sql) |
| invalidate_employee_snapshots | [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql) |
| invalidate_permission_snapshots | [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql) |
| protect_employee_removal | [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql) |
| protect_joining_date | [005_assignment_version_guard.sql](../acme-salary-app/database/migrations/005_assignment_version_guard.sql) |
| protect_team_identity | [011_team_integrity.sql](../acme-salary-app/database/migrations/011_team_integrity.sql) |
| record_salary_history | [004_salary_history_atomic.sql](../acme-salary-app/database/migrations/004_salary_history_atomic.sql) |
| revoke_disabled_identity | [009_identity_revocation.sql](../acme-salary-app/database/migrations/009_identity_revocation.sql) |
| salary_in_force | [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql) |
| validate_assignment_date | [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql) |
| validate_fx_revision | [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql) |
| validate_hold_actor | [002_country_employee_fx.sql](../acme-salary-app/database/migrations/002_country_employee_fx.sql) |
| validate_salary_decision | [006_approval_currency_guard.sql](../acme-salary-app/database/migrations/006_approval_currency_guard.sql) |
| validate_salary_record | [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql) |
| validate_salary_request | [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql) |
| verify_approved_salary_exists | [003_salary_approval.sql](../acme-salary-app/database/migrations/003_salary_approval.sql) |

## Representation and future work cautions

Stored salary numeric(18,4) text may have four trailing decimal places, while validateSalary rejects user input exceeding the country precision even when extra digits are zeros. Future UI serialization must distinguish input precision from DB scale. Currency and country code shape checks do not constitute a complete ISO catalogue. Pending status comes from a view, not a hidden request.status column. No salary-band, attachment, document, project, LLM, job or deployment-status table exists. New structures are planned only after approved scope; do not fabricate field names from the old SDD. See [BACKLOG.md](BACKLOG.md).
