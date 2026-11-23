-- Monthly revisions/corrections use immutable command results for safe retry after lease consumption.
CREATE TABLE salary_commands (
  actor_id uuid NOT NULL REFERENCES users(id),
  command_id uuid NOT NULL,
  input_hash text NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  employee_id uuid NOT NULL REFERENCES employees(id),
  outcome text NOT NULL CHECK (outcome IN ('RECORDED','PENDING_APPROVAL')),
  salary_id uuid UNIQUE REFERENCES salary_records(id),
  request_id uuid UNIQUE REFERENCES salary_change_requests(id),
  employee_version integer NOT NULL CHECK (employee_version>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(actor_id,command_id),
  CHECK ((outcome='RECORDED' AND salary_id IS NOT NULL AND request_id IS NULL) OR
    (outcome='PENDING_APPROVAL' AND salary_id IS NULL AND request_id IS NOT NULL))
);
GRANT SELECT,INSERT ON salary_commands TO acme_app;
CREATE INDEX salary_history_record_idx ON salary_history_events(salary_record_id,updated_at,id);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON salary_commands
  FOR EACH ROW EXECUTE FUNCTION block_immutable_change();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON salary_commands
  FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();

CREATE FUNCTION validate_ordinary_salary_write() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor users%ROWTYPE;
BEGIN
  -- Approved INITIAL/BACKDATED rows retain the matching-request/independent-decision guards.
  IF NEW.approval_request_id IS NOT NULL THEN RETURN NEW; END IF;
  SELECT * INTO actor FROM users WHERE id=NEW.created_by AND status='ACTIVE' AND NOT is_system FOR SHARE;
  IF actor.id IS NULL OR actor.employee_id IS NULL OR actor.employee_id=NEW.employee_id OR
    NOT (actor.is_hr_manager OR actor.permissions @> ARRAY['read','edit','salary:view']) THEN
    RAISE EXCEPTION 'Independent linked salary editor required' USING ERRCODE='42501'; END IF;
  PERFORM id FROM employees WHERE id IN (actor.employee_id,NEW.employee_id) ORDER BY id FOR UPDATE;
  IF NOT EXISTS(SELECT 1 FROM employees WHERE id=actor.employee_id AND removed_at IS NULL) THEN
    RAISE EXCEPTION 'Live employee linkage required' USING ERRCODE='42501'; END IF;
  IF NEW.submitted_business_date<>(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date OR
    NEW.effective_from<NEW.submitted_business_date OR NEW.approval_status<>'WAITING_MANAGEMENT_APPROVAL' THEN
    RAISE EXCEPTION 'Ordinary salaries require current submission date and pending review status' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS(SELECT 1 FROM salary_records WHERE employee_id=NEW.employee_id) THEN
    RAISE EXCEPTION 'Approve the initial salary before revising it' USING ERRCODE='42501'; END IF;
  IF NEW.corrects_id IS NOT NULL AND EXISTS(SELECT 1 FROM salary_records WHERE corrects_id=NEW.corrects_id) THEN
    RAISE EXCEPTION 'Correction target is no longer current' USING ERRCODE='40001'; END IF;
  PERFORM 1 FROM country_rules c WHERE c.country_code=NEW.country_code AND c.is_active AND
    c.version=NEW.country_rule_version AND c.default_currency=NEW.default_currency AND
    c.decimal_places=NEW.decimal_places AND c.rounding_mode=NEW.rounding_mode FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Country policy changed before salary save' USING ERRCODE='40001'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER ordinary_salary_write_guard BEFORE INSERT ON salary_records
  FOR EACH ROW EXECUTE FUNCTION validate_ordinary_salary_write();
REVOKE ALL ON FUNCTION validate_ordinary_salary_write() FROM PUBLIC;

CREATE FUNCTION validate_salary_command_result() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.outcome='RECORDED' AND NOT EXISTS(SELECT 1 FROM salary_records s WHERE s.id=NEW.salary_id
    AND s.employee_id=NEW.employee_id AND s.created_by=NEW.actor_id AND s.approval_request_id IS NULL) THEN
    RAISE EXCEPTION 'Command must match its recorded salary' USING ERRCODE='23514'; END IF;
  IF NEW.outcome='PENDING_APPROVAL' AND NOT EXISTS(SELECT 1 FROM salary_change_requests r WHERE r.id=NEW.request_id
    AND r.employee_id=NEW.employee_id AND r.requested_by=NEW.actor_id AND r.request_kind='BACKDATED') THEN
    RAISE EXCEPTION 'Command must match its backdated request' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS(SELECT 1 FROM employees WHERE id=NEW.employee_id AND version=NEW.employee_version) THEN
    RAISE EXCEPTION 'Command result version changed before commit' USING ERRCODE='40001'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER salary_command_result_guard BEFORE INSERT ON salary_commands
  FOR EACH ROW EXECUTE FUNCTION validate_salary_command_result();
REVOKE ALL ON FUNCTION validate_salary_command_result() FROM PUBLIC;

-- A later-effective INITIAL is still the first approved entry. An earlier-dated later insert is REVISION.
-- Classify via the approved request kind, avoiding multi-row AFTER-trigger visibility ambiguities.
CREATE OR REPLACE FUNCTION record_salary_history() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous salary_records%ROWTYPE; event_type text;
BEGIN
  SELECT s.* INTO previous FROM salary_records s
  WHERE s.employee_id=NEW.employee_id AND s.id<>NEW.id AND s.effective_from<=NEW.effective_from
    AND NOT EXISTS(SELECT 1 FROM salary_records c WHERE c.corrects_id=s.id AND c.id<>NEW.id)
  ORDER BY s.effective_from DESC,s.created_at DESC,s.id LIMIT 1;
  event_type := CASE WHEN NEW.corrects_id IS NOT NULL THEN 'TYPO_CORRECTION'
    WHEN EXISTS(SELECT 1 FROM salary_change_requests r WHERE r.id=NEW.approval_request_id AND r.request_kind='INITIAL') THEN 'INITIAL'
    WHEN previous.id IS NOT NULL AND previous.country_code<>NEW.country_code THEN 'COUNTRY_TRANSFER'
    ELSE 'REVISION' END;
  INSERT INTO salary_history_events(employee_id,salary_record_id,change_type,description,before_state,after_state,updated_by)
  VALUES(NEW.employee_id,NEW.id,event_type,NEW.change_reason,
    CASE WHEN previous.id IS NOT NULL THEN to_jsonb(previous) END,to_jsonb(NEW),NEW.created_by);
  IF previous.id IS NOT NULL AND previous.currency<>NEW.currency THEN
    INSERT INTO salary_history_events(employee_id,salary_record_id,change_type,description,before_state,after_state,updated_by)
    VALUES(NEW.employee_id,NEW.id,'CURRENCY_CHANGE',NEW.change_reason,to_jsonb(previous),to_jsonb(NEW),NEW.created_by);
  END IF;
  INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
  VALUES(NEW.created_by,'SALARY',NEW.id::text,event_type,NEW.change_reason,
    jsonb_build_object('before',CASE WHEN previous.id IS NOT NULL THEN to_jsonb(previous) END,'after',to_jsonb(NEW)));
  UPDATE employees SET version=version+1,updated_at=now() WHERE id=NEW.employee_id;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION record_salary_history() FROM PUBLIC;
