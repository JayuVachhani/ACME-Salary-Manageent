CREATE TABLE currencies (
  code text PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),
  minor_units smallint NOT NULL CHECK (minor_units BETWEEN 0 AND 4),
  is_active boolean NOT NULL DEFAULT true
);
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
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL UNIQUE CHECK (length(trim(name::text)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1
);
CREATE TABLE designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL UNIQUE CHECK (length(trim(name::text)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1
);
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
CREATE UNIQUE INDEX employees_code_live_uq ON employees(employee_code) WHERE removed_at IS NULL;
CREATE UNIQUE INDEX employees_email_live_uq ON employees(email) WHERE removed_at IS NULL;
CREATE INDEX employees_name_trgm ON employees USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX employees_code_trgm ON employees USING gin (employee_code gin_trgm_ops);
CREATE INDEX employees_email_trgm ON employees USING gin ((email::text) gin_trgm_ops);
ALTER TABLE users ADD CONSTRAINT users_employee_fk FOREIGN KEY (employee_id) REFERENCES employees(id);

-- Effective-dated organization assignments preserve historical country/department/status.
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
CREATE INDEX assignment_employee_date_idx ON employee_assignments(employee_id, effective_from DESC);
CREATE TRIGGER assignment_immutable BEFORE UPDATE OR DELETE ON employee_assignments
FOR EACH ROW EXECUTE FUNCTION block_immutable_change();
CREATE TRIGGER assignment_no_truncate BEFORE TRUNCATE ON employee_assignments
FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();
CREATE FUNCTION validate_assignment_date() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM employees WHERE id = NEW.employee_id AND joining_date <= NEW.effective_from AND removed_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Assignment date or employee state invalid' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER assignment_date_check BEFORE INSERT ON employee_assignments
FOR EACH ROW EXECUTE FUNCTION validate_assignment_date();

CREATE TABLE retention_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  placed_by uuid NOT NULL REFERENCES users(id),
  placed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE retention_hold_releases (
  hold_id uuid PRIMARY KEY REFERENCES retention_holds(id),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  released_by uuid NOT NULL REFERENCES users(id),
  released_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX holds_employee_idx ON retention_holds(employee_id);
CREATE FUNCTION protect_employee_removal() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Permanent employee deletion is not supported' USING ERRCODE='55000'; END IF;
  IF OLD.removed_at IS NULL AND NEW.removed_at IS NOT NULL AND EXISTS (
    SELECT 1 FROM retention_holds h WHERE h.employee_id=OLD.id
    AND NOT EXISTS (SELECT 1 FROM retention_hold_releases r WHERE r.hold_id=h.id)
  ) THEN RAISE EXCEPTION 'Employee has an active retention hold' USING ERRCODE='55000'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER employee_retention_guard BEFORE UPDATE OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION protect_employee_removal();
CREATE TRIGGER employees_no_truncate BEFORE TRUNCATE ON employees
FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();
CREATE FUNCTION validate_hold_actor() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor uuid; employee uuid;
BEGIN
  IF TG_TABLE_NAME = 'retention_holds' THEN actor := NEW.placed_by; employee := NEW.employee_id;
  ELSE actor := NEW.released_by; SELECT employee_id INTO employee FROM retention_holds WHERE id=NEW.hold_id; END IF;
  -- Same employee lock order as removal makes hold placement/removal races serialize.
  PERFORM 1 FROM employees WHERE id=employee AND removed_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Employee unavailable' USING ERRCODE='23514'; END IF;
  PERFORM 1 FROM users WHERE id=actor AND status='ACTIVE' AND is_hr_manager AND NOT is_system;
  IF NOT FOUND THEN RAISE EXCEPTION 'HR Manager required' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER hold_actor_check BEFORE INSERT ON retention_holds FOR EACH ROW EXECUTE FUNCTION validate_hold_actor();
CREATE TRIGGER release_actor_check BEFORE INSERT ON retention_hold_releases FOR EACH ROW EXECUTE FUNCTION validate_hold_actor();
CREATE FUNCTION audit_hold_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME='retention_holds' THEN
    INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
    VALUES(NEW.placed_by,'RETENTION_HOLD',NEW.id::text,'PLACED',NEW.reason,to_jsonb(NEW));
  ELSE
    INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
    VALUES(NEW.released_by,'RETENTION_HOLD',NEW.hold_id::text,'RELEASED',NEW.reason,to_jsonb(NEW));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER hold_audit AFTER INSERT ON retention_holds FOR EACH ROW EXECUTE FUNCTION audit_hold_event();
CREATE TRIGGER release_audit AFTER INSERT ON retention_hold_releases FOR EACH ROW EXECUTE FUNCTION audit_hold_event();

-- Corrections append a new revision; no rate row is overwritten.
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
CREATE INDEX fx_lookup_idx ON fx_rate_revisions(base_currency,quote_currency,effective_date DESC,revision DESC);
CREATE FUNCTION validate_fx_revision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE expected integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.base_currency || ':' || NEW.quote_currency || ':' || NEW.effective_date::text,0));
  SELECT coalesce(max(revision),0)+1 INTO expected FROM fx_rate_revisions
  WHERE base_currency=NEW.base_currency AND quote_currency=NEW.quote_currency AND effective_date=NEW.effective_date;
  IF NEW.revision<>expected THEN RAISE EXCEPTION 'Stale FX revision' USING ERRCODE='40001'; END IF;
  PERFORM 1 FROM users WHERE id=NEW.created_by AND status='ACTIVE' AND is_hr_manager AND NOT is_system;
  IF NOT FOUND THEN RAISE EXCEPTION 'HR Manager required' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END; $$;
CREATE FUNCTION audit_fx_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
  VALUES(NEW.created_by,'FX_RATE',NEW.id::text,'REVISION',NEW.reason,to_jsonb(NEW));
  RETURN NEW;
END; $$;
CREATE TRIGGER fx_validate BEFORE INSERT ON fx_rate_revisions FOR EACH ROW EXECUTE FUNCTION validate_fx_revision();
CREATE TRIGGER fx_audit AFTER INSERT ON fx_rate_revisions FOR EACH ROW EXECUTE FUNCTION audit_fx_revision();

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['retention_holds','retention_hold_releases','fx_rate_revisions'] LOOP
    EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION block_immutable_change()',table_name);
    EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change()',table_name);
  END LOOP;
END; $$;

CREATE TABLE record_locks (
  employee_id uuid PRIMARY KEY REFERENCES employees(id),
  locked_by uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE users ADD COLUMN authorization_version integer NOT NULL DEFAULT 1;
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
CREATE TABLE report_snapshot_employees (
  snapshot_id uuid NOT NULL REFERENCES report_snapshots(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id),
  PRIMARY KEY(snapshot_id,employee_id)
);
CREATE INDEX snapshot_employee_idx ON report_snapshot_employees(employee_id,snapshot_id);
CREATE FUNCTION invalidate_permission_snapshots() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.permissions IS DISTINCT FROM OLD.permissions OR NEW.status IS DISTINCT FROM OLD.status OR
     NEW.is_hr_manager IS DISTINCT FROM OLD.is_hr_manager OR NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
    NEW.authorization_version := OLD.authorization_version+1;
    UPDATE report_snapshots SET invalidated_at=now() WHERE owner_id=OLD.id AND invalidated_at IS NULL;
  ELSIF NEW.authorization_version IS DISTINCT FROM OLD.authorization_version THEN
    RAISE EXCEPTION 'Authorization version is managed automatically' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER user_snapshot_invalidation BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION invalidate_permission_snapshots();
CREATE FUNCTION invalidate_employee_snapshots() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.removed_at IS NULL AND NEW.removed_at IS NOT NULL THEN
    UPDATE report_snapshots SET invalidated_at=now() WHERE invalidated_at IS NULL AND id IN (
      SELECT snapshot_id FROM report_snapshot_employees WHERE employee_id=NEW.id
    );
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER employee_snapshot_invalidation AFTER UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION invalidate_employee_snapshots();

GRANT SELECT,INSERT,UPDATE ON currencies,country_rules,departments,designations,employees TO acme_app;
GRANT SELECT,INSERT ON employee_assignments,retention_holds,retention_hold_releases,fx_rate_revisions TO acme_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON record_locks,report_snapshots,report_snapshot_employees TO acme_app;
REVOKE ALL ON FUNCTION validate_assignment_date(),protect_employee_removal(),validate_hold_actor(),audit_hold_event(),
  validate_fx_revision(),audit_fx_revision(),invalidate_permission_snapshots(),invalidate_employee_snapshots() FROM PUBLIC;
