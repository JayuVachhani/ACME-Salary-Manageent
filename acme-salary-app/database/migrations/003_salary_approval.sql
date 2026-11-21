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
CREATE INDEX requests_employee_date_idx ON salary_change_requests(employee_id,effective_from);
CREATE TABLE salary_approval_decisions (
  request_id uuid PRIMARY KEY REFERENCES salary_change_requests(id),
  decision text NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
  decided_by uuid NOT NULL REFERENCES users(id),
  comment text NOT NULL CHECK (length(trim(comment)) > 0),
  decided_at timestamptz NOT NULL DEFAULT now()
);
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
ALTER TABLE salary_change_requests ADD CONSTRAINT request_correction_fk FOREIGN KEY(corrects_id) REFERENCES salary_records(id);
CREATE UNIQUE INDEX salary_original_date_uq ON salary_records(employee_id,effective_from) WHERE corrects_id IS NULL;
CREATE UNIQUE INDEX salary_correction_uq ON salary_records(corrects_id) WHERE corrects_id IS NOT NULL;
CREATE INDEX salary_employee_date_idx ON salary_records(employee_id,effective_from DESC);
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

CREATE FUNCTION validate_salary_request() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE employee employees%ROWTYPE;
BEGIN
  SELECT * INTO employee FROM employees WHERE id=NEW.employee_id FOR UPDATE;
  IF employee.id IS NULL OR employee.removed_at IS NOT NULL OR NEW.effective_from<employee.joining_date THEN
    RAISE EXCEPTION 'Employee or effective date invalid' USING ERRCODE='23514'; END IF;
  IF employee.version<>NEW.expected_employee_version THEN RAISE EXCEPTION 'Stale employee version' USING ERRCODE='40001'; END IF;
  PERFORM 1 FROM users WHERE id=NEW.requested_by AND status='ACTIVE' AND is_hr_manager AND NOT is_system
    AND employee_id IS DISTINCT FROM NEW.employee_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Authorized non-subject HR Manager required' USING ERRCODE='42501'; END IF;
  IF EXISTS(SELECT 1 FROM salary_change_requests r WHERE r.employee_id=NEW.employee_id AND r.effective_from=NEW.effective_from
    AND NOT EXISTS(SELECT 1 FROM salary_approval_decisions d WHERE d.request_id=r.id)) THEN
    RAISE EXCEPTION 'Duplicate pending request' USING ERRCODE='23505'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER request_validate BEFORE INSERT ON salary_change_requests FOR EACH ROW EXECUTE FUNCTION validate_salary_request();

CREATE FUNCTION validate_salary_decision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE request salary_change_requests%ROWTYPE;
BEGIN
  SELECT * INTO request FROM salary_change_requests WHERE id=NEW.request_id;
  IF request.id IS NULL THEN RAISE EXCEPTION 'Unknown salary request' USING ERRCODE='23503'; END IF;
  PERFORM 1 FROM employees WHERE id=request.employee_id FOR UPDATE;
  PERFORM 1 FROM users WHERE id=NEW.decided_by AND status='ACTIVE' AND is_hr_manager AND NOT is_system
    AND id<>request.requested_by AND employee_id IS DISTINCT FROM request.employee_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Independent HR Manager required' USING ERRCODE='42501'; END IF;
  IF NEW.decision='APPROVED' THEN
    PERFORM 1 FROM employees WHERE id=request.employee_id AND removed_at IS NULL AND version=request.expected_employee_version;
    IF NOT FOUND THEN RAISE EXCEPTION 'Request is stale or employee unavailable' USING ERRCODE='40001'; END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER decision_validate BEFORE INSERT ON salary_approval_decisions FOR EACH ROW EXECUTE FUNCTION validate_salary_decision();

CREATE FUNCTION validate_salary_record() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE original salary_records%ROWTYPE; request salary_change_requests%ROWTYPE;
BEGIN
  PERFORM 1 FROM employees WHERE id=NEW.employee_id AND removed_at IS NULL AND joining_date<=NEW.effective_from FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Employee or effective date invalid' USING ERRCODE='23514'; END IF;
  IF NEW.corrects_id IS NOT NULL THEN
    SELECT * INTO original FROM salary_records WHERE id=NEW.corrects_id;
    IF original.id IS NULL OR original.employee_id<>NEW.employee_id OR original.effective_from<>NEW.effective_from THEN
      RAISE EXCEPTION 'Correction must retain employee and effective date' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.effective_from<NEW.submitted_business_date AND NEW.approval_request_id IS NULL THEN
    RAISE EXCEPTION 'Backdated salary requires approval' USING ERRCODE='42501'; END IF;
  IF NEW.approval_request_id IS NOT NULL THEN
    SELECT * INTO request FROM salary_change_requests WHERE id=NEW.approval_request_id;
    IF request.id IS NULL OR NOT EXISTS(SELECT 1 FROM salary_approval_decisions WHERE request_id=request.id AND decision='APPROVED')
      OR request.employee_id<>NEW.employee_id OR request.effective_from<>NEW.effective_from
      OR request.monthly_amount<>NEW.monthly_amount OR request.currency<>NEW.currency
      OR request.corrects_id IS DISTINCT FROM NEW.corrects_id OR request.requested_by<>NEW.created_by
      OR request.country_code<>NEW.country_code OR request.default_currency<>NEW.default_currency
      OR request.country_rule_version<>NEW.country_rule_version OR request.decimal_places<>NEW.decimal_places
      OR request.rounding_mode<>NEW.rounding_mode OR request.conversion_meta<>NEW.conversion_meta
      OR request.reason<>NEW.change_reason OR NEW.approval_status<>'ACTIVE' THEN
      RAISE EXCEPTION 'Salary does not match approved request' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER salary_validate BEFORE INSERT ON salary_records FOR EACH ROW EXECUTE FUNCTION validate_salary_record();

-- A decision cannot commit independently of its approved salary row.
CREATE FUNCTION verify_approved_salary_exists() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.decision='APPROVED' AND NOT EXISTS(SELECT 1 FROM salary_records WHERE approval_request_id=NEW.request_id) THEN
    RAISE EXCEPTION 'Approved decision requires salary in same transaction' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END; $$;
CREATE CONSTRAINT TRIGGER approval_salary_atomic AFTER INSERT ON salary_approval_decisions
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION verify_approved_salary_exists();

CREATE FUNCTION audit_salary_approval() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME='salary_change_requests' THEN
    INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
    VALUES(NEW.requested_by,'SALARY_REQUEST',NEW.id::text,'SUBMITTED',NEW.reason,to_jsonb(NEW));
  ELSE
    INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
    VALUES(NEW.decided_by,'SALARY_REQUEST',NEW.request_id::text,NEW.decision,NEW.comment,to_jsonb(NEW));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER request_audit AFTER INSERT ON salary_change_requests FOR EACH ROW EXECUTE FUNCTION audit_salary_approval();
CREATE TRIGGER decision_audit AFTER INSERT ON salary_approval_decisions FOR EACH ROW EXECUTE FUNCTION audit_salary_approval();

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['salary_records','salary_history_events','salary_change_requests','salary_approval_decisions'] LOOP
    EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION block_immutable_change()',table_name);
    EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change()',table_name);
  END LOOP;
END; $$;
CREATE FUNCTION salary_in_force(as_of date) RETURNS SETOF salary_records LANGUAGE sql STABLE AS $$
  SELECT DISTINCT ON (s.employee_id) s.* FROM salary_records s
  WHERE s.effective_from<=as_of AND NOT EXISTS(SELECT 1 FROM salary_records c WHERE c.corrects_id=s.id)
  ORDER BY s.employee_id,s.effective_from DESC,s.created_at DESC,s.id
$$;
CREATE VIEW salary_periods AS SELECT s.*,
  lead(effective_from) OVER(PARTITION BY employee_id ORDER BY effective_from) AS effective_to
  FROM salary_records s WHERE NOT EXISTS(SELECT 1 FROM salary_records c WHERE c.corrects_id=s.id);
CREATE VIEW salary_request_status AS SELECT r.*,coalesce(d.decision,'PENDING') AS status,
  d.decided_by,d.comment AS decision_comment,d.decided_at
  FROM salary_change_requests r LEFT JOIN salary_approval_decisions d ON d.request_id=r.id;

GRANT SELECT,INSERT ON salary_records,salary_history_events,salary_change_requests,salary_approval_decisions TO acme_app;
GRANT SELECT ON salary_periods,salary_request_status TO acme_app;
REVOKE ALL ON FUNCTION salary_in_force(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION salary_in_force(date) TO acme_app;
REVOKE ALL ON FUNCTION validate_salary_request(),validate_salary_decision(),validate_salary_record(),
  verify_approved_salary_exists(),audit_salary_approval() FROM PUBLIC;
