CREATE FUNCTION advance_assignment_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE employees SET version=version+1,updated_at=now() WHERE id=NEW.employee_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER assignment_version AFTER INSERT ON employee_assignments
FOR EACH ROW EXECUTE FUNCTION advance_assignment_version();

CREATE FUNCTION protect_joining_date() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.joining_date IS DISTINCT FROM OLD.joining_date AND (
    EXISTS(SELECT 1 FROM employee_assignments WHERE employee_id=OLD.id AND effective_from<NEW.joining_date)
    OR EXISTS(SELECT 1 FROM salary_records WHERE employee_id=OLD.id AND effective_from<NEW.joining_date)
    OR EXISTS(SELECT 1 FROM salary_change_requests WHERE employee_id=OLD.id AND effective_from<NEW.joining_date)
  ) THEN RAISE EXCEPTION 'Joining date would invalidate existing history' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER joining_date_history_guard BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION protect_joining_date();
REVOKE ALL ON FUNCTION advance_assignment_version(),protect_joining_date() FROM PUBLIC;
