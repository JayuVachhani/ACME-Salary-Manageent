CREATE TABLE payroll_policies (
 id uuid PRIMARY KEY,policy_key text NOT NULL,version integer NOT NULL CHECK(version>0),effective_from date NOT NULL CHECK(extract(day FROM effective_from)=1 AND extract(year FROM effective_from) BETWEEN 2000 AND 9998),
 config jsonb NOT NULL CHECK(jsonb_typeof(config)='object' AND config->>'countryCode'='IN' AND config->>'currency'='INR' AND config->>'finalizerRole' IN('HR','FINANCE')),
 policy_hash text NOT NULL CHECK(policy_hash~'^[a-f0-9]{64}$'),reason text NOT NULL CHECK(length(trim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL REFERENCES users(id),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(policy_key,version)
);
CREATE TABLE payroll_policy_approvals(policy_id uuid PRIMARY KEY REFERENCES payroll_policies(id),approved_by uuid NOT NULL REFERENCES users(id),comment text NOT NULL CHECK(length(trim(comment)) BETWEEN 1 AND 1000),approved_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX payroll_policies_effective_idx ON payroll_policies(policy_key,effective_from DESC,version DESC);
GRANT SELECT,INSERT ON payroll_policies,payroll_policy_approvals TO acme_app;
CREATE FUNCTION guard_payroll_policy() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE creator uuid;candidate text;actor uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('acme_payroll_policy_approval'));
 IF TG_TABLE_NAME='payroll_policies' THEN
  actor:=NEW.created_by;
  IF NEW.version<>(SELECT coalesce(max(version),0)+1 FROM payroll_policies WHERE policy_key=NEW.policy_key) THEN RAISE EXCEPTION 'Policy version changed' USING ERRCODE='40001'; END IF;
  IF jsonb_typeof(NEW.config->'financeApproverIds')<>'array' OR jsonb_array_length(NEW.config->'financeApproverIds')=0 OR jsonb_typeof(NEW.config->'directorApproverIds')<>'array' THEN RAISE EXCEPTION 'Explicit approver assignment required' USING ERRCODE='23514'; END IF;
  FOR candidate IN SELECT jsonb_array_elements_text(NEW.config->'financeApproverIds') UNION SELECT jsonb_array_elements_text(NEW.config->'directorApproverIds') LOOP
   PERFORM 1 FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.id=candidate::uuid AND u.status='ACTIVE' AND NOT u.is_system AND e.removed_at IS NULL AND (u.is_hr_manager OR u.permissions@>ARRAY['read','salary:view']) FOR SHARE OF u,e;
   IF NOT FOUND THEN RAISE EXCEPTION 'Approver account is unavailable' USING ERRCODE='42501'; END IF;
  END LOOP;
 ELSE
  actor:=NEW.approved_by;SELECT created_by INTO creator FROM payroll_policies WHERE id=NEW.policy_id;
  IF creator IS NULL OR creator=actor THEN RAISE EXCEPTION 'Different HR manager must approve a policy' USING ERRCODE='42501'; END IF;
  PERFORM e.id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.id=actor AND e.removed_at IS NULL FOR SHARE OF e;
  IF NOT FOUND THEN RAISE EXCEPTION 'Live employee linkage required to approve policy' USING ERRCODE='42501'; END IF;
 END IF;
 PERFORM 1 FROM users WHERE id=actor AND status='ACTIVE' AND is_hr_manager AND NOT is_system FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active HR manager required' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER payroll_policy_guard BEFORE INSERT ON payroll_policies FOR EACH ROW EXECUTE FUNCTION guard_payroll_policy();
CREATE TRIGGER payroll_policy_approval_guard BEFORE INSERT ON payroll_policy_approvals FOR EACH ROW EXECUTE FUNCTION guard_payroll_policy();
CREATE FUNCTION audit_payroll_policy() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_TABLE_NAME='payroll_policies' THEN
  INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload) VALUES(NEW.created_by,'PAYROLL_POLICY',NEW.id::text,'DRAFTED',NEW.reason,to_jsonb(NEW));
 ELSE
  INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload) VALUES(NEW.approved_by,'PAYROLL_POLICY',NEW.policy_id::text,'APPROVED',NEW.comment,to_jsonb(NEW));
 END IF;RETURN NEW;
END; $$;
CREATE TRIGGER payroll_policy_audit AFTER INSERT ON payroll_policies FOR EACH ROW EXECUTE FUNCTION audit_payroll_policy();
CREATE TRIGGER payroll_policy_approval_audit AFTER INSERT ON payroll_policy_approvals FOR EACH ROW EXECUTE FUNCTION audit_payroll_policy();
DO $$DECLARE item text;BEGIN FOREACH item IN ARRAY ARRAY['payroll_policies','payroll_policy_approvals'] LOOP
 EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION block_immutable_change()',item);
 EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change()',item);
END LOOP;END;$$;
REVOKE ALL ON FUNCTION guard_payroll_policy(),audit_payroll_policy() FROM PUBLIC;
