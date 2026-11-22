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
