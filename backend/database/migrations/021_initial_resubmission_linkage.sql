-- Creation bootstraps the directory. Later salary changes require verified employee linkage.
CREATE FUNCTION require_linked_initial_resubmitter() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.request_kind='INITIAL' AND NOT EXISTS(
    SELECT 1 FROM employees WHERE id=NEW.employee_id AND created_at=transaction_timestamp()
  ) AND NOT EXISTS(
    SELECT 1 FROM users u JOIN employees e ON e.id=u.employee_id
      WHERE u.id=NEW.requested_by AND u.status='ACTIVE' AND NOT u.is_system AND e.removed_at IS NULL
        AND e.id<>NEW.employee_id
  ) THEN RAISE EXCEPTION 'Verified employee linkage required for salary resubmission' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER linked_initial_resubmitter BEFORE INSERT ON salary_change_requests
  FOR EACH ROW EXECUTE FUNCTION require_linked_initial_resubmitter();
REVOKE ALL ON FUNCTION require_linked_initial_resubmitter() FROM PUBLIC;
