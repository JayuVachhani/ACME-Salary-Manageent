-- Linkage is an explicit independent HR operation, never an email-match side effect.
CREATE FUNCTION guard_employee_linkage() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor uuid; actor_employee uuid; reason text;
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.employee_id IS NULL THEN RETURN NEW; END IF;
    RAISE EXCEPTION 'Create an account before linking an employee' USING ERRCODE='42501';
  END IF;
  IF NEW.employee_id IS NOT DISTINCT FROM OLD.employee_id THEN RETURN NEW; END IF;
  actor := nullif(current_setting('acme.link_actor',true),'')::uuid;
  reason := nullif(trim(current_setting('acme.link_reason',true)),'');
  IF actor IS NULL OR reason IS NULL OR length(reason)>1000 OR
     current_setting('acme.link_confirmed',true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Confirmed HR linkage and reason required' USING ERRCODE='42501';
  END IF;
  SELECT employee_id INTO actor_employee FROM users
    WHERE id=actor AND status='ACTIVE' AND is_hr_manager AND NOT is_system FOR SHARE;
  IF NOT FOUND OR actor=OLD.id OR OLD.is_system OR OLD.status='DELETED' OR
     (actor_employee IS NOT NULL AND (actor_employee=OLD.employee_id OR actor_employee=NEW.employee_id)) THEN
    RAISE EXCEPTION 'Independent active HR Manager required' USING ERRCODE='42501';
  END IF;
  -- Serialize against soft removal; lock old/new subjects in a stable order.
  PERFORM id FROM employees WHERE id IN (OLD.employee_id,NEW.employee_id) ORDER BY id FOR UPDATE;
  IF NEW.employee_id IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM employees WHERE id=NEW.employee_id AND removed_at IS NULL
  ) THEN RAISE EXCEPTION 'Employee unavailable' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER employee_link_guard BEFORE INSERT OR UPDATE OF employee_id ON users
FOR EACH ROW EXECUTE FUNCTION guard_employee_linkage();

CREATE FUNCTION audit_employee_linkage() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous_employee jsonb; next_employee jsonb;
BEGIN
  IF NEW.employee_id IS NOT DISTINCT FROM OLD.employee_id THEN RETURN NEW; END IF;
  SELECT jsonb_build_object('id',id,'code',employee_code,'name',first_name||' '||last_name)
    INTO previous_employee FROM employees WHERE id=OLD.employee_id;
  SELECT jsonb_build_object('id',id,'code',employee_code,'name',first_name||' '||last_name)
    INTO next_employee FROM employees WHERE id=NEW.employee_id;
  UPDATE user_sessions SET revoked_at=clock_timestamp() WHERE user_id=NEW.id AND revoked_at IS NULL;
  UPDATE login_challenges SET consumed_at=clock_timestamp() WHERE user_id=NEW.id AND consumed_at IS NULL;
  DELETE FROM record_locks WHERE locked_by=NEW.id;
  UPDATE report_snapshots SET invalidated_at=clock_timestamp() WHERE invalidated_at IS NULL AND
    (owner_id=NEW.id OR id IN (SELECT snapshot_id FROM report_snapshot_employees
      WHERE employee_id IN (OLD.employee_id,NEW.employee_id)));
  INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
    VALUES(nullif(current_setting('acme.link_actor',true),'')::uuid,'USER',NEW.id::text,
      'EMPLOYEE_LINK_CHANGED',trim(current_setting('acme.link_reason',true)),
      jsonb_build_object('before',previous_employee,'after',next_employee,'version',NEW.team_version));
  RETURN NEW;
END;
$$;
CREATE TRIGGER employee_link_audit AFTER UPDATE OF employee_id ON users
FOR EACH ROW EXECUTE FUNCTION audit_employee_linkage();
REVOKE ALL ON FUNCTION guard_employee_linkage(),audit_employee_linkage() FROM PUBLIC;
