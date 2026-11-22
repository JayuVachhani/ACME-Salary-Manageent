-- ADR-005: initial salary is a request, never an automatically approved ledger entry.
ALTER TABLE salary_change_requests ADD COLUMN request_kind text NOT NULL DEFAULT 'BACKDATED'
  CHECK (request_kind IN ('INITIAL','BACKDATED'));
DO $$ DECLARE constraint_name text; BEGIN
  FOR constraint_name IN SELECT conname FROM pg_constraint
    WHERE conrelid='salary_change_requests'::regclass AND contype='c'
      AND pg_get_constraintdef(oid) LIKE '%effective_from%submitted_business_date%'
  LOOP EXECUTE format('ALTER TABLE salary_change_requests DROP CONSTRAINT %I',constraint_name); END LOOP;
END; $$;
ALTER TABLE salary_change_requests ADD CONSTRAINT request_date_by_kind
  CHECK (request_kind='INITIAL' OR effective_from<submitted_business_date);
CREATE TABLE employee_creation_commands (
  actor_id uuid NOT NULL REFERENCES users(id),
  command_id uuid NOT NULL,
  input_hash text NOT NULL,
  employee_id uuid NOT NULL REFERENCES employees(id),
  request_id uuid NOT NULL REFERENCES salary_change_requests(id),
  PRIMARY KEY(actor_id,command_id)
);
GRANT SELECT,INSERT ON employee_creation_commands TO acme_app;
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON employee_creation_commands
  FOR EACH ROW EXECUTE FUNCTION block_immutable_change();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON employee_creation_commands
  FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();

CREATE OR REPLACE FUNCTION validate_salary_request() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE employee employees%ROWTYPE; actor users%ROWTYPE;
BEGIN
  SELECT * INTO employee FROM employees WHERE id=NEW.employee_id FOR UPDATE;
  IF employee.id IS NULL OR employee.removed_at IS NOT NULL OR NEW.effective_from<employee.joining_date THEN
    RAISE EXCEPTION 'Employee or effective date invalid' USING ERRCODE='23514'; END IF;
  IF employee.version<>NEW.expected_employee_version THEN RAISE EXCEPTION 'Stale employee version' USING ERRCODE='40001'; END IF;
  SELECT * INTO actor FROM users WHERE id=NEW.requested_by AND status='ACTIVE' AND NOT is_system;
  IF actor.id IS NULL OR actor.employee_id=NEW.employee_id THEN
    RAISE EXCEPTION 'Independent active account required' USING ERRCODE='42501'; END IF;
  IF NEW.request_kind='INITIAL' THEN
    IF NOT actor.is_hr_manager AND NOT (actor.permissions @> ARRAY['read','write','salary:view']) THEN
      RAISE EXCEPTION 'Employee creation permission required' USING ERRCODE='42501'; END IF;
    IF NEW.corrects_id IS NOT NULL OR EXISTS(SELECT 1 FROM salary_records WHERE employee_id=NEW.employee_id) OR
       EXISTS(SELECT 1 FROM salary_change_requests r WHERE r.employee_id=NEW.employee_id AND
         NOT EXISTS(SELECT 1 FROM salary_approval_decisions d WHERE d.request_id=r.id AND d.decision='REJECTED')) THEN
      RAISE EXCEPTION 'Initial salary already exists' USING ERRCODE='23505'; END IF;
  ELSE
    IF NOT actor.is_hr_manager OR actor.employee_id IS NULL THEN
      RAISE EXCEPTION 'Linked HR Manager required' USING ERRCODE='42501'; END IF;
  END IF;
  IF EXISTS(SELECT 1 FROM salary_change_requests r WHERE r.employee_id=NEW.employee_id AND r.effective_from=NEW.effective_from
    AND NOT EXISTS(SELECT 1 FROM salary_approval_decisions d WHERE d.request_id=r.id)) THEN
    RAISE EXCEPTION 'Duplicate pending request' USING ERRCODE='23505'; END IF;
  RETURN NEW;
END; $$;

CREATE FUNCTION require_linked_salary_approver() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM users u JOIN employees e ON e.id=u.employee_id
    WHERE u.id=NEW.decided_by AND u.status='ACTIVE' AND u.is_hr_manager AND NOT u.is_system AND e.removed_at IS NULL) THEN
    RAISE EXCEPTION 'Verified employee linkage required' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER linked_salary_approver BEFORE INSERT ON salary_approval_decisions
  FOR EACH ROW EXECUTE FUNCTION require_linked_salary_approver();
CREATE FUNCTION require_initial_approval() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM salary_records WHERE employee_id=NEW.employee_id) AND NOT EXISTS(
    SELECT 1 FROM salary_change_requests r JOIN salary_approval_decisions d ON d.request_id=r.id
    WHERE r.id=NEW.approval_request_id AND r.request_kind='INITIAL' AND d.decision='APPROVED') THEN
    RAISE EXCEPTION 'Initial salary needs independent approval' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER initial_salary_approval BEFORE INSERT ON salary_records
  FOR EACH ROW EXECUTE FUNCTION require_initial_approval();
REVOKE ALL ON FUNCTION require_linked_salary_approver(),require_initial_approval() FROM PUBLIC;
-- Recreate the view to expose kind without changing existing column positions.
CREATE OR REPLACE VIEW salary_request_status AS SELECT r.id,r.employee_id,r.requested_by,r.submitted_business_date,r.effective_from,
  r.expected_employee_version,r.monthly_amount,r.currency,r.country_code,r.default_currency,r.country_rule_version,
  r.decimal_places,r.rounding_mode,r.corrects_id,r.reason,r.conversion_meta,r.created_at,
  coalesce(d.decision,'PENDING') AS status,d.decided_by,d.comment AS decision_comment,d.decided_at,r.request_kind
  FROM salary_change_requests r LEFT JOIN salary_approval_decisions d ON d.request_id=r.id;
