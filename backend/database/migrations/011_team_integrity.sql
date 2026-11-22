ALTER TABLE users ADD COLUMN team_version integer NOT NULL DEFAULT 1 CHECK(team_version > 0);
CREATE FUNCTION protect_team_identity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor uuid;
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Permanent user deletion is prohibited' USING ERRCODE='55000'; END IF;
  IF TG_OP='UPDATE' AND OLD.is_system THEN RAISE EXCEPTION 'System identity is protected' USING ERRCODE='42501'; END IF;
  actor := nullif(current_setting('acme.team_actor',true),'')::uuid;
  IF actor IS NOT NULL THEN
    PERFORM 1 FROM users WHERE id=actor AND status='ACTIVE' AND is_hr_manager AND NOT is_system FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Active HR Manager required' USING ERRCODE='42501'; END IF;
    IF TG_OP='UPDATE' AND OLD.id=actor AND
      (NEW.permissions IS DISTINCT FROM OLD.permissions OR NEW.is_hr_manager IS DISTINCT FROM OLD.is_hr_manager) THEN
      RAISE EXCEPTION 'Own permissions cannot be changed' USING ERRCODE='42501';
    END IF;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF OLD.is_hr_manager AND OLD.status='ACTIVE' AND (NOT NEW.is_hr_manager OR NEW.status<>'ACTIVE') THEN
      PERFORM pg_advisory_xact_lock(hashtext('acme_team_management'));
      IF NOT EXISTS(SELECT 1 FROM users WHERE id<>OLD.id AND status='ACTIVE' AND is_hr_manager AND NOT is_system) THEN
        RAISE EXCEPTION 'At least one active HR Manager must remain' USING ERRCODE='23514';
      END IF;
    END IF;
    NEW.team_version := OLD.team_version+1;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER team_identity_guard BEFORE INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION protect_team_identity();
CREATE FUNCTION audit_team_identity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor uuid;
BEGIN
  actor := nullif(current_setting('acme.team_actor',true),'')::uuid;
  IF actor IS NOT NULL THEN
    INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
      VALUES(actor,'USER',NEW.id::text,CASE WHEN TG_OP='INSERT' THEN 'TEAM_INVITED' ELSE 'TEAM_UPDATED' END,
        'HR team management action', jsonb_build_object('status',NEW.status,'isHrManager',NEW.is_hr_manager,
          'permissions',NEW.permissions,'version',NEW.team_version));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER team_identity_audit AFTER INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION audit_team_identity();
REVOKE ALL ON FUNCTION protect_team_identity(),audit_team_identity() FROM PUBLIC;
