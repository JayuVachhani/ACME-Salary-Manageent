-- Payroll run snapshots are separate from editable manual drafts. No payment execution.
CREATE TABLE payroll_runs (
 id uuid PRIMARY KEY,period_month date NOT NULL CHECK(extract(day FROM period_month)=1),
 status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN('DRAFT','HR_REVIEWED','FINANCE_APPROVED','DIRECTOR_APPROVED','FINALIZED')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),generation integer NOT NULL DEFAULT 1 CHECK(generation>0),
 policy_snapshot jsonb NOT NULL,source_hash text NOT NULL,employee_count integer NOT NULL CHECK(employee_count BETWEEN 1 AND 100),
 created_by uuid NOT NULL REFERENCES users(id),hr_reviewer_id uuid NOT NULL REFERENCES users(id),finance_approver_id uuid NOT NULL REFERENCES users(id),director_approver_id uuid REFERENCES users(id),requires_director boolean NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),finalized_at timestamptz,
 CHECK(NOT requires_director OR director_approver_id IS NOT NULL),CHECK((status='FINALIZED')=(finalized_at IS NOT NULL))
);
CREATE INDEX payroll_runs_period_idx ON payroll_runs(period_month DESC,created_at DESC,id);
CREATE TABLE payroll_run_lines (
 id uuid PRIMARY KEY,run_id uuid NOT NULL REFERENCES payroll_runs(id),generation integer NOT NULL CHECK(generation>0),employee_id uuid NOT NULL REFERENCES employees(id),snapshot jsonb NOT NULL,
 UNIQUE(run_id,generation,employee_id)
);
CREATE TABLE payroll_run_events (
 id uuid PRIMARY KEY,run_id uuid NOT NULL REFERENCES payroll_runs(id),version integer NOT NULL,generation integer NOT NULL,action text NOT NULL,
 from_status text,to_status text NOT NULL,actor_id uuid NOT NULL REFERENCES users(id),actor_name text NOT NULL,reason text NOT NULL CHECK(length(trim(reason)) BETWEEN 1 AND 1000),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(run_id,version)
);
CREATE TABLE payroll_run_commands (
 actor_id uuid NOT NULL REFERENCES users(id),command_id uuid NOT NULL,input_hash text NOT NULL,run_id uuid NOT NULL REFERENCES payroll_runs(id),result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(actor_id,command_id)
);
CREATE FUNCTION guard_payroll_run_header() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Payroll run history cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'DRAFT' OR NEW.version<>1 OR NEW.generation<>1 THEN RAISE EXCEPTION 'Runs start as draft version one' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 IF OLD.status='FINALIZED' THEN RAISE EXCEPTION 'Finalized payroll is immutable' USING ERRCODE='23514'; END IF;
 IF NEW.version<>OLD.version+1 OR NEW.id<>OLD.id OR NEW.created_by<>OLD.created_by OR NEW.created_at<>OLD.created_at OR NEW.period_month<>OLD.period_month THEN RAISE EXCEPTION 'Invalid payroll run revision' USING ERRCODE='23514'; END IF;
 IF NEW.status='DRAFT' AND OLD.status='DRAFT' THEN
  IF NEW.generation<>OLD.generation+1 THEN RAISE EXCEPTION 'Refresh requires a new immutable generation' USING ERRCODE='23514'; END IF;
 ELSE
  IF NEW.generation<>OLD.generation OR NEW.source_hash<>OLD.source_hash OR NEW.policy_snapshot<>OLD.policy_snapshot OR NEW.employee_count<>OLD.employee_count OR NEW.hr_reviewer_id<>OLD.hr_reviewer_id OR NEW.finance_approver_id<>OLD.finance_approver_id OR NEW.director_approver_id IS DISTINCT FROM OLD.director_approver_id OR NEW.requires_director<>OLD.requires_director THEN RAISE EXCEPTION 'Financial payload is locked after review' USING ERRCODE='23514'; END IF;
  IF NOT((NEW.status='DRAFT' AND OLD.status IN('HR_REVIEWED','FINANCE_APPROVED','DIRECTOR_APPROVED')) OR (OLD.status='DRAFT' AND NEW.status='HR_REVIEWED') OR (OLD.status='HR_REVIEWED' AND NEW.status='FINANCE_APPROVED') OR (OLD.status='FINANCE_APPROVED' AND NEW.status='DIRECTOR_APPROVED' AND OLD.requires_director) OR (NEW.status='FINALIZED' AND ((OLD.status='FINANCE_APPROVED' AND NOT OLD.requires_director) OR (OLD.status='DIRECTOR_APPROVED' AND OLD.requires_director)))) THEN RAISE EXCEPTION 'Invalid payroll approval transition' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER payroll_run_header_guard BEFORE INSERT OR UPDATE OR DELETE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION guard_payroll_run_header();
CREATE FUNCTION guard_payroll_run_line() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM payroll_runs WHERE id=NEW.run_id AND generation=NEW.generation AND status='DRAFT') THEN RAISE EXCEPTION 'Lines require current draft generation' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER payroll_run_line_guard BEFORE INSERT ON payroll_run_lines FOR EACH ROW EXECUTE FUNCTION guard_payroll_run_line();
CREATE FUNCTION verify_payroll_run_atomic() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM payroll_run_events WHERE run_id=NEW.id AND version=NEW.version AND generation=NEW.generation AND to_status=NEW.status) OR (SELECT count(*) FROM payroll_run_lines WHERE run_id=NEW.id AND generation=NEW.generation)<>NEW.employee_count THEN RAISE EXCEPTION 'Run must commit with matching lines and event' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE CONSTRAINT TRIGGER payroll_run_atomic AFTER INSERT OR UPDATE ON payroll_runs DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION verify_payroll_run_atomic();
DO $$ DECLARE name text; BEGIN
 FOREACH name IN ARRAY ARRAY['payroll_run_lines','payroll_run_events','payroll_run_commands'] LOOP
 EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION block_immutable_change()',name);
 END LOOP;
 FOREACH name IN ARRAY ARRAY['payroll_runs','payroll_run_lines','payroll_run_events','payroll_run_commands'] LOOP
 EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change()',name);
 END LOOP;
END; $$;
REVOKE ALL ON FUNCTION guard_payroll_run_header(),guard_payroll_run_line(),verify_payroll_run_atomic() FROM PUBLIC;
CREATE TABLE payroll_finalized_allocations (
 employee_id uuid NOT NULL REFERENCES employees(id),period_month date NOT NULL,run_id uuid NOT NULL REFERENCES payroll_runs(id),line_id uuid NOT NULL REFERENCES payroll_run_lines(id),PRIMARY KEY(employee_id,period_month),UNIQUE(line_id)
);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON payroll_finalized_allocations FOR EACH ROW EXECUTE FUNCTION block_immutable_change();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON payroll_finalized_allocations FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();
CREATE FUNCTION allocate_finalized_payroll() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status='FINALIZED' AND OLD.status<>'FINALIZED' THEN
  INSERT INTO payroll_finalized_allocations(employee_id,period_month,run_id,line_id)
  SELECT employee_id,NEW.period_month,NEW.id,id FROM payroll_run_lines WHERE run_id=NEW.id AND generation=NEW.generation ORDER BY employee_id;
 END IF; RETURN NEW;
END; $$;
CREATE TRIGGER allocate_finalized_payroll AFTER UPDATE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION allocate_finalized_payroll();
REVOKE ALL ON FUNCTION allocate_finalized_payroll() FROM PUBLIC;
CREATE FUNCTION guard_payroll_run_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor users%ROWTYPE; current_run payroll_runs%ROWTYPE; previous_status text;
BEGIN
 SELECT * INTO actor FROM users WHERE id=NEW.actor_id AND status='ACTIVE' AND NOT is_system FOR SHARE;
 SELECT * INTO current_run FROM payroll_runs WHERE id=NEW.run_id;
 IF actor.id IS NULL OR actor.employee_id IS NULL OR NOT EXISTS(SELECT 1 FROM employees WHERE id=actor.employee_id AND removed_at IS NULL) OR NOT(actor.is_hr_manager OR actor.permissions@>ARRAY['read','salary:view']) THEN RAISE EXCEPTION 'Live linked payroll access required' USING ERRCODE='42501'; END IF;
 IF NEW.version<>current_run.version OR NEW.generation<>current_run.generation OR NEW.to_status<>current_run.status THEN RAISE EXCEPTION 'Event must describe current payroll revision' USING ERRCODE='23514'; END IF;
 SELECT to_status INTO previous_status FROM payroll_run_events WHERE run_id=NEW.run_id AND version=NEW.version-1;
 IF NEW.from_status IS DISTINCT FROM previous_status THEN RAISE EXCEPTION 'Event must describe prior payroll state' USING ERRCODE='23514'; END IF;
 IF NEW.action IN('CREATE','REFRESH') THEN
  IF NOT actor.is_hr_manager OR NEW.to_status<>'DRAFT' OR (NEW.action='CREATE' AND (NEW.version<>1 OR actor.id<>current_run.created_by)) THEN RAISE EXCEPTION 'HR prepares payroll drafts' USING ERRCODE='42501'; END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM payroll_run_lines WHERE run_id=NEW.run_id AND generation=NEW.generation AND employee_id=actor.employee_id) THEN RAISE EXCEPTION 'Own payroll approval is prohibited; use independent reviewers or split runs' USING ERRCODE='42501'; END IF;
  IF NOT ((NEW.action='HR_REVIEW' AND actor.is_hr_manager AND actor.id=current_run.hr_reviewer_id AND NEW.to_status='HR_REVIEWED') OR (NEW.action='FINANCE_APPROVE' AND actor.id=current_run.finance_approver_id AND NEW.to_status='FINANCE_APPROVED') OR (NEW.action='DIRECTOR_APPROVE' AND actor.id=current_run.director_approver_id AND current_run.requires_director AND NEW.to_status='DIRECTOR_APPROVED') OR (NEW.action='REJECT' AND NEW.to_status='DRAFT' AND (actor.is_hr_manager OR actor.id=current_run.finance_approver_id OR actor.id=current_run.director_approver_id)) OR (NEW.action='FINALIZE' AND NEW.to_status='FINALIZED' AND ((current_run.policy_snapshot->'config'->>'finalizerRole'='HR' AND actor.is_hr_manager) OR (current_run.policy_snapshot->'config'->>'finalizerRole'='FINANCE' AND actor.id=current_run.finance_approver_id)))) THEN RAISE EXCEPTION 'Assigned payroll approval stage required' USING ERRCODE='42501'; END IF;
 END IF;
 NEW.actor_name:=actor.full_name; RETURN NEW;
END; $$;
CREATE TRIGGER payroll_run_event_guard BEFORE INSERT ON payroll_run_events FOR EACH ROW EXECUTE FUNCTION guard_payroll_run_event();
CREATE FUNCTION guard_finalized_allocation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM payroll_runs r JOIN payroll_run_lines l ON l.run_id=r.id AND l.generation=r.generation WHERE r.id=NEW.run_id AND r.status='FINALIZED' AND r.period_month=NEW.period_month AND l.id=NEW.line_id AND l.employee_id=NEW.employee_id) THEN RAISE EXCEPTION 'Allocation must describe a finalized immutable payroll line' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER finalized_allocation_guard BEFORE INSERT ON payroll_finalized_allocations FOR EACH ROW EXECUTE FUNCTION guard_finalized_allocation();
REVOKE ALL ON FUNCTION guard_payroll_run_event(),guard_finalized_allocation() FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON payroll_runs TO acme_app;
GRANT SELECT,INSERT ON payroll_run_lines,payroll_run_events,payroll_run_commands,payroll_finalized_allocations TO acme_app;
