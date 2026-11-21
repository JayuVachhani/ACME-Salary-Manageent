-- Forward-only: preserve checksums of previously applied migrations.
CREATE OR REPLACE FUNCTION validate_salary_decision() RETURNS trigger LANGUAGE plpgsql AS $$
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
    PERFORM 1 FROM currencies WHERE code=request.currency AND is_active FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Requested currency is inactive' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION validate_salary_decision() FROM PUBLIC;
