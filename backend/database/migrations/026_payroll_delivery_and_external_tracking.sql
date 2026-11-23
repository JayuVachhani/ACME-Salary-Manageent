-- Depends on 025 payroll-run workflow. Delivery always references the immutable FINALIZED generation.
-- No bank details/provider payloads, partial settlement, reversals or actual transfers are implemented.
CREATE TABLE payroll_payment_preparations (
  id uuid PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES payroll_runs(id),
  run_version integer NOT NULL CHECK (run_version>0),
  generation integer NOT NULL CHECK (generation>0),
  period text NOT NULL,
  source_hash text NOT NULL,
  manifest jsonb NOT NULL CHECK (jsonb_typeof(manifest)='array'),
  manifest_count integer NOT NULL CHECK (manifest_count>0 AND manifest_count=jsonb_array_length(manifest)),
  manifest_hash text NOT NULL CHECK (manifest_hash ~ '^[a-f0-9]{64}$'),
  prepared_by uuid NOT NULL REFERENCES users(id),
  prepared_by_name text NOT NULL,
  command_id uuid NOT NULL,
  input_hash text NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(prepared_by,command_id)
);
CREATE INDEX payroll_preparations_run_idx ON payroll_payment_preparations(run_id,created_at DESC,id);
CREATE TABLE payroll_external_payment_reports (
  id uuid PRIMARY KEY,
  run_id uuid NOT NULL UNIQUE REFERENCES payroll_runs(id),
  preparation_id uuid NOT NULL REFERENCES payroll_payment_preparations(id),
  external_reference text NOT NULL CHECK (length(trim(external_reference)) BETWEEN 1 AND 200),
  payment_date date NOT NULL,
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 1000),
  reported_by uuid NOT NULL REFERENCES users(id),
  reported_by_name text NOT NULL,
  reported_at timestamptz NOT NULL DEFAULT now(),
  command_id uuid NOT NULL,
  input_hash text NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  UNIQUE(reported_by,command_id)
);
CREATE TABLE payroll_delivery_exports (
  id uuid PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES users(id),
  command_id uuid NOT NULL,
  input_hash text NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  run_id uuid NOT NULL REFERENCES payroll_runs(id),
  kind text NOT NULL CHECK (kind IN ('PAYSLIP_HTML','PAYMENT_MANIFEST_CSV')),
  employee_id uuid REFERENCES employees(id),
  preparation_id uuid REFERENCES payroll_payment_preparations(id),
  content_hash text NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(actor_id,command_id),
  CHECK ((kind='PAYSLIP_HTML' AND employee_id IS NOT NULL AND preparation_id IS NULL) OR
    (kind='PAYMENT_MANIFEST_CSV' AND preparation_id IS NOT NULL AND employee_id IS NULL))
);
GRANT SELECT,INSERT ON payroll_payment_preparations,payroll_external_payment_reports,payroll_delivery_exports TO acme_app;

CREATE FUNCTION payroll_delivery_reader_allowed(actor_uuid uuid,run_uuid uuid,needs_export boolean) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS(SELECT 1 FROM users u JOIN payroll_runs r ON r.id=run_uuid
    WHERE u.id=actor_uuid AND u.status='ACTIVE' AND NOT u.is_system AND r.status='FINALIZED' AND r.finalized_at IS NOT NULL
    AND (u.is_hr_manager OR (u.permissions @> ARRAY['read','salary:view'] AND
      ((r.policy_snapshot->'financeApproverIds') ? u.id::text OR (r.policy_snapshot->'directorApproverIds') ? u.id::text)))
    AND (NOT needs_export OR u.is_hr_manager OR u.permissions @> ARRAY['export']))
$$;
REVOKE ALL ON FUNCTION payroll_delivery_reader_allowed(uuid,uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION payroll_delivery_reader_allowed(uuid,uuid,boolean) TO acme_app;

CREATE FUNCTION guard_payroll_payment_preparation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE run payroll_runs%ROWTYPE; actor users%ROWTYPE; line_count integer;
BEGIN
  SELECT * INTO actor FROM users WHERE id=NEW.prepared_by FOR SHARE;
  SELECT * INTO run FROM payroll_runs WHERE id=NEW.run_id FOR SHARE;
  IF NOT payroll_delivery_reader_allowed(NEW.prepared_by,NEW.run_id,true) OR NOT EXISTS(
    SELECT 1 FROM employees WHERE id=actor.employee_id AND removed_at IS NULL FOR SHARE
  ) THEN RAISE EXCEPTION 'Current payroll export permission and live linkage required' USING ERRCODE='42501'; END IF;
  IF run.version<>NEW.run_version OR run.generation<>NEW.generation OR run.source_hash IS DISTINCT FROM NEW.source_hash OR
    to_char(run.period_month,'YYYY-MM')<>NEW.period THEN
    RAISE EXCEPTION 'Preparation must retain the finalized run version and generation' USING ERRCODE='23514'; END IF;
  SELECT count(*)::int INTO line_count FROM payroll_run_lines WHERE run_id=run.id AND generation=run.generation;
  IF jsonb_typeof(NEW.manifest)<>'array' OR jsonb_array_length(NEW.manifest)<>line_count OR
    NEW.manifest_count<>line_count OR line_count=0 THEN
    RAISE EXCEPTION 'Manifest must include the complete finalized payroll generation' USING ERRCODE='23514'; END IF;
  IF (SELECT count(DISTINCT (value->>'employeeId')::uuid) FROM jsonb_array_elements(NEW.manifest))<>line_count THEN
    RAISE EXCEPTION 'Manifest employees must be unique' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.manifest) item WHERE jsonb_typeof(item.value)<>'object' OR
    NOT(item.value ?& ARRAY['employeeId','employeeCode','currency','netAmount']) OR
    item.value-ARRAY['employeeId','employeeCode','currency','netAmount']<>'{}'::jsonb OR
    jsonb_typeof(item.value->'netAmount')<>'string' OR item.value->>'currency'<>'INR' OR
    (item.value->>'netAmount') !~ '^(0|[1-9][0-9]*)(\.[0-9]{1,4})?$') THEN
    RAISE EXCEPTION 'Manifest accepts only immutable employee identifiers and exact INR net amounts' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.manifest) item LEFT JOIN payroll_run_lines line
    ON line.run_id=run.id AND line.generation=run.generation AND line.employee_id=(item.value->>'employeeId')::uuid
    WHERE line.id IS NULL OR line.snapshot->'employee'->>'code' IS DISTINCT FROM item.value->>'employeeCode'
      OR line.snapshot->>'currency' IS DISTINCT FROM 'INR' OR line.snapshot->>'net' IS DISTINCT FROM item.value->>'netAmount') THEN
    RAISE EXCEPTION 'Manifest amount differs from finalized payroll' USING ERRCODE='23514'; END IF;
  NEW.prepared_by_name:=actor.full_name;
  RETURN NEW;
END; $$;
CREATE TRIGGER payroll_preparation_guard BEFORE INSERT ON payroll_payment_preparations
  FOR EACH ROW EXECUTE FUNCTION guard_payroll_payment_preparation();

CREATE FUNCTION guard_payroll_external_payment_report() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE run payroll_runs%ROWTYPE; preparation payroll_payment_preparations%ROWTYPE; actor users%ROWTYPE;
BEGIN
  SELECT * INTO actor FROM users WHERE id=NEW.reported_by FOR SHARE;
  SELECT * INTO run FROM payroll_runs WHERE id=NEW.run_id FOR SHARE;
  SELECT * INTO preparation FROM payroll_payment_preparations WHERE id=NEW.preparation_id;
  IF NOT payroll_delivery_reader_allowed(NEW.reported_by,NEW.run_id,false) OR actor.id IS DISTINCT FROM run.finance_approver_id OR
     NOT EXISTS(SELECT 1 FROM employees WHERE id=actor.employee_id AND removed_at IS NULL FOR SHARE) OR EXISTS(
       SELECT 1 FROM payroll_run_lines WHERE run_id=run.id AND generation=run.generation AND employee_id=actor.employee_id
     ) THEN RAISE EXCEPTION 'Only the linked actual Finance approver may report a run without their own payroll record' USING ERRCODE='42501'; END IF;
  IF preparation.id IS NULL OR preparation.run_id<>run.id OR preparation.run_version<>run.version OR
     preparation.generation<>run.generation OR preparation.source_hash IS DISTINCT FROM run.source_hash THEN
    RAISE EXCEPTION 'External report must reference the complete finalized payment preparation' USING ERRCODE='23514'; END IF;
  NEW.reported_by_name:=actor.full_name;
  RETURN NEW;
END; $$;
CREATE TRIGGER payroll_external_payment_guard BEFORE INSERT ON payroll_external_payment_reports
  FOR EACH ROW EXECUTE FUNCTION guard_payroll_external_payment_report();

CREATE FUNCTION guard_payroll_delivery_export() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE run payroll_runs%ROWTYPE;
BEGIN
  SELECT * INTO run FROM payroll_runs WHERE id=NEW.run_id FOR SHARE;
  IF NOT payroll_delivery_reader_allowed(NEW.actor_id,NEW.run_id,true) THEN
    RAISE EXCEPTION 'Current payroll document export permission required' USING ERRCODE='42501'; END IF;
  IF NEW.kind='PAYSLIP_HTML' AND NOT EXISTS(SELECT 1 FROM payroll_run_lines WHERE run_id=run.id AND generation=run.generation AND employee_id=NEW.employee_id) THEN
    RAISE EXCEPTION 'Finalized payslip unavailable' USING ERRCODE='23514'; END IF;
  IF NEW.kind='PAYMENT_MANIFEST_CSV' AND NOT EXISTS(SELECT 1 FROM payroll_payment_preparations WHERE id=NEW.preparation_id AND run_id=run.id AND generation=run.generation AND run_version=run.version) THEN
    RAISE EXCEPTION 'Finalized payment preparation unavailable' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER payroll_delivery_export_guard BEFORE INSERT ON payroll_delivery_exports
  FOR EACH ROW EXECUTE FUNCTION guard_payroll_delivery_export();

CREATE FUNCTION audit_payroll_delivery_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor_uuid uuid; change text; description text; payload jsonb;
BEGIN
  IF TG_TABLE_NAME='payroll_payment_preparations' THEN
    actor_uuid:=NEW.prepared_by; change:='PAYMENT_PREPARED';
    description:='Provider-neutral full-run manifest prepared; no transfer or paid assertion';
    payload:=to_jsonb(NEW)-'manifest';
  ELSIF TG_TABLE_NAME='payroll_external_payment_reports' THEN
    actor_uuid:=NEW.reported_by; change:='EXTERNAL_PAYMENT_REPORTED';
    description:='Assigned Finance manually reported external full-net payment; ACME did not transfer or verify money';
    payload:=to_jsonb(NEW);
  ELSE
    actor_uuid:=NEW.actor_id; change:='PAYROLL_DOCUMENT_EXPORTED';
    description:='Protected finalized payroll document exported'; payload:=to_jsonb(NEW);
  END IF;
  INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
    VALUES(actor_uuid,'PAYROLL_DELIVERY',NEW.id::text,change,description,payload||jsonb_build_object('providerProcessed',false));
  RETURN NEW;
END; $$;
DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['payroll_payment_preparations','payroll_external_payment_reports','payroll_delivery_exports'] LOOP
    EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION block_immutable_change()',table_name);
    EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change()',table_name);
    EXECUTE format('CREATE TRIGGER payroll_delivery_audit AFTER INSERT ON %I FOR EACH ROW EXECUTE FUNCTION audit_payroll_delivery_event()',table_name);
  END LOOP;
END; $$;
REVOKE ALL ON FUNCTION guard_payroll_payment_preparation(),guard_payroll_external_payment_report(),
  guard_payroll_delivery_export(),audit_payroll_delivery_event() FROM PUBLIC;
