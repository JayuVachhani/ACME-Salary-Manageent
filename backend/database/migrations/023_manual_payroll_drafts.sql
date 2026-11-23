-- Explicitly approved manual India/INR drafts. No pay calculation, statutory check or salary-ledger write.
CREATE TABLE payroll_drafts (
  id uuid PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id),
  period_month date NOT NULL CHECK (extract(day FROM period_month)=1 AND extract(year FROM period_month) BETWEEN 2000 AND 9998),
  period_end date NOT NULL,
  pay_date date NOT NULL,
  country_code text NOT NULL DEFAULT 'IN' CHECK (country_code='IN'),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency='INR'),
  version integer NOT NULL DEFAULT 1 CHECK (version>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id,period_month),
  CHECK (period_end=(period_month+interval '1 month'-interval '1 day')::date),
  CHECK (pay_date=(period_month+interval '1 month'+interval '6 days')::date)
);
CREATE INDEX payroll_drafts_period_idx ON payroll_drafts(period_month DESC,updated_at DESC,id);
CREATE TABLE payroll_draft_revisions (
  id uuid PRIMARY KEY,
  draft_id uuid NOT NULL REFERENCES payroll_drafts(id),
  version integer NOT NULL CHECK (version>0),
  employee_snapshot jsonb NOT NULL CHECK (jsonb_typeof(employee_snapshot)='object'),
  earnings jsonb NOT NULL CHECK (jsonb_typeof(earnings)='object'),
  deductions jsonb NOT NULL CHECK (jsonb_typeof(deductions)='object'),
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 1000),
  created_by uuid NOT NULL REFERENCES users(id),
  created_by_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(draft_id,version)
);
CREATE TABLE payroll_draft_commands (
  actor_id uuid NOT NULL REFERENCES users(id),
  command_id uuid NOT NULL,
  input_hash text NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  draft_id uuid NOT NULL REFERENCES payroll_drafts(id),
  revision_id uuid NOT NULL UNIQUE REFERENCES payroll_draft_revisions(id),
  PRIMARY KEY(actor_id,command_id)
);
GRANT SELECT,INSERT,UPDATE ON payroll_drafts TO acme_app;
GRANT SELECT,INSERT ON payroll_draft_revisions,payroll_draft_commands TO acme_app;

CREATE FUNCTION guard_payroll_draft_header() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Manual payroll draft history cannot be deleted' USING ERRCODE='55000'; END IF;
  IF TG_OP='INSERT' AND NEW.version<>1 THEN
    RAISE EXCEPTION 'New manual payroll drafts start at version one' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.id<>OLD.id OR NEW.employee_id<>OLD.employee_id OR NEW.period_month<>OLD.period_month OR
       NEW.period_end<>OLD.period_end OR NEW.pay_date<>OLD.pay_date OR NEW.country_code<>OLD.country_code OR
       NEW.currency<>OLD.currency OR NEW.created_at<>OLD.created_at OR NEW.version<>OLD.version+1 THEN
      RAISE EXCEPTION 'Employee, month and draft configuration are immutable; append a revision' USING ERRCODE='23514'; END IF;
    NEW.updated_at:=clock_timestamp();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER payroll_draft_header_guard BEFORE INSERT OR UPDATE OR DELETE ON payroll_drafts
  FOR EACH ROW EXECUTE FUNCTION guard_payroll_draft_header();
CREATE TRIGGER payroll_drafts_no_truncate BEFORE TRUNCATE ON payroll_drafts
  FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();

CREATE FUNCTION guard_payroll_draft_revision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor users%ROWTYPE; draft payroll_drafts%ROWTYPE; identity jsonb; item record;
  earning_keys text[]:=ARRAY['basic','hra','allowances','bonuses','incentives','overtime'];
  deduction_keys text[]:=ARRAY['pf','esi','professionalTax','tds','unpaidLeave','authorized'];
BEGIN
  SELECT * INTO actor FROM users WHERE id=NEW.created_by AND status='ACTIVE' AND is_hr_manager AND NOT is_system FOR SHARE;
  SELECT * INTO draft FROM payroll_drafts WHERE id=NEW.draft_id;
  IF actor.id IS NULL OR actor.employee_id IS NULL OR draft.id IS NULL OR actor.employee_id=draft.employee_id THEN
    RAISE EXCEPTION 'Independent linked HR Manager required for manual payroll drafts' USING ERRCODE='42501'; END IF;
  PERFORM id FROM employees WHERE id IN (actor.employee_id,draft.employee_id) ORDER BY id FOR UPDATE;
  SELECT * INTO draft FROM payroll_drafts WHERE id=NEW.draft_id FOR UPDATE;
  IF NOT EXISTS(SELECT 1 FROM employees WHERE id=actor.employee_id AND removed_at IS NULL) THEN
    RAISE EXCEPTION 'Live employee linkage required' USING ERRCODE='42501'; END IF;
  SELECT jsonb_build_object('id',id,'code',employee_code,'name',first_name||' '||last_name,'email',email::text)
    INTO identity FROM employees WHERE id=draft.employee_id AND removed_at IS NULL;
  IF identity IS NULL OR NEW.employee_snapshot IS DISTINCT FROM identity THEN
    RAISE EXCEPTION 'Employee identity changed before saving the draft' USING ERRCODE='23514'; END IF;
  IF NEW.version<>draft.version OR (NEW.version>1 AND NOT EXISTS(
    SELECT 1 FROM payroll_draft_revisions WHERE draft_id=draft.id AND version=NEW.version-1
  )) THEN RAISE EXCEPTION 'Manual draft version changed' USING ERRCODE='40001'; END IF;
  IF jsonb_typeof(NEW.earnings)<>'object' OR NOT(NEW.earnings ?& earning_keys) OR NEW.earnings-earning_keys<>'{}'::jsonb OR
     jsonb_typeof(NEW.deductions)<>'object' OR NOT(NEW.deductions ?& deduction_keys) OR NEW.deductions-deduction_keys<>'{}'::jsonb THEN
    RAISE EXCEPTION 'Supply exactly the approved manual component fields' USING ERRCODE='23514'; END IF;
  FOR item IN SELECT value FROM jsonb_each(NEW.earnings) UNION ALL SELECT value FROM jsonb_each(NEW.deductions) LOOP
    IF jsonb_typeof(item.value)<>'string' OR (item.value #>> '{}') !~ '^(0|[1-9][0-9]{0,13})(\.[0-9]{1,2})?$' THEN
      RAISE EXCEPTION 'Manual components must be nonnegative decimal strings with at most two decimal places' USING ERRCODE='23514'; END IF;
  END LOOP;
  NEW.created_by_name:=actor.full_name;
  RETURN NEW;
END; $$;
CREATE TRIGGER payroll_revision_guard BEFORE INSERT ON payroll_draft_revisions
  FOR EACH ROW EXECUTE FUNCTION guard_payroll_draft_revision();
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON payroll_draft_revisions
  FOR EACH ROW EXECUTE FUNCTION block_immutable_change();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON payroll_draft_revisions
  FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();

CREATE FUNCTION audit_payroll_draft_revision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous jsonb; current_payload jsonb;
BEGIN
  SELECT jsonb_build_object('version',version,'employee',employee_snapshot,'earnings',earnings,'deductions',deductions)
    INTO previous FROM payroll_draft_revisions WHERE draft_id=NEW.draft_id AND version=NEW.version-1;
  current_payload:=jsonb_build_object('revisionId',NEW.id,'version',NEW.version,'employee',NEW.employee_snapshot,
    'earnings',NEW.earnings,'deductions',NEW.deductions,'status','DRAFT');
  INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
    VALUES(NEW.created_by,'PAYROLL_DRAFT',NEW.draft_id::text,CASE WHEN NEW.version=1 THEN 'DRAFT_CREATED' ELSE 'DRAFT_REVISED' END,
      NEW.reason,jsonb_build_object('before',previous,'after',current_payload));
  RETURN NEW;
END; $$;
CREATE TRIGGER payroll_revision_audit AFTER INSERT ON payroll_draft_revisions
  FOR EACH ROW EXECUTE FUNCTION audit_payroll_draft_revision();
CREATE FUNCTION verify_payroll_draft_revision_exists() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM payroll_draft_revisions WHERE draft_id=NEW.id AND version=NEW.version) THEN
    RAISE EXCEPTION 'Manual payroll draft must commit with its matching immutable revision' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END; $$;
CREATE CONSTRAINT TRIGGER payroll_draft_revision_atomic AFTER INSERT OR UPDATE ON payroll_drafts
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION verify_payroll_draft_revision_exists();

CREATE FUNCTION guard_payroll_draft_command() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM payroll_draft_revisions WHERE id=NEW.revision_id AND draft_id=NEW.draft_id AND created_by=NEW.actor_id) THEN
    RAISE EXCEPTION 'Manual draft command must match its saved revision and actor' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER payroll_command_guard BEFORE INSERT ON payroll_draft_commands
  FOR EACH ROW EXECUTE FUNCTION guard_payroll_draft_command();
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON payroll_draft_commands
  FOR EACH ROW EXECUTE FUNCTION block_immutable_change();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON payroll_draft_commands
  FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();
REVOKE ALL ON FUNCTION guard_payroll_draft_header(),guard_payroll_draft_revision(),audit_payroll_draft_revision(),
  verify_payroll_draft_revision_exists(),guard_payroll_draft_command() FROM PUBLIC;
