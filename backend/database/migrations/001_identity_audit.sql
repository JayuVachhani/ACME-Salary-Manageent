CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL,
  full_name text NOT NULL CHECK (length(trim(full_name)) > 0),
  is_hr_manager boolean NOT NULL DEFAULT false,
  permissions text[] NOT NULL DEFAULT ARRAY['read'],
  status text NOT NULL CHECK (status IN ('INVITED','ACTIVE','DELETED')),
  employee_id uuid,
  invited_by uuid REFERENCES users(id),
  invite_expires_at timestamptz,
  is_system boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (permissions <@ ARRAY['read','write','edit','delete','salary:view','export']),
  CHECK ((status = 'DELETED') = (deleted_at IS NOT NULL)),
  CHECK (NOT is_system OR (status = 'ACTIVE' AND NOT is_hr_manager AND cardinality(permissions) = 0))
);
CREATE UNIQUE INDEX users_live_email_uq ON users(email) WHERE status <> 'DELETED';
CREATE UNIQUE INDEX users_one_system_uq ON users(is_system) WHERE is_system;
CREATE UNIQUE INDEX users_employee_link_uq ON users(employee_id) WHERE status <> 'DELETED' AND employee_id IS NOT NULL;

CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES users(id),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  change_type text NOT NULL,
  description text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC, id DESC);
CREATE INDEX audit_actor_idx ON audit_logs(actor_id, created_at DESC);

CREATE FUNCTION block_immutable_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME USING ERRCODE = '55000';
END;
$$;
CREATE TRIGGER audit_no_mutation BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION block_immutable_change();
CREATE TRIGGER audit_no_truncate BEFORE TRUNCATE ON audit_logs
FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();

INSERT INTO users(id, email, full_name, status, is_system, permissions, created_at)
VALUES ('00000000-0000-4000-8000-000000000001', 'system@acme.invalid', 'System', 'ACTIVE', true, ARRAY[]::text[], '2026-01-01T00:00:00Z');
INSERT INTO audit_logs(actor_id, entity_type, entity_id, change_type, description)
VALUES ('00000000-0000-4000-8000-000000000001', 'SYSTEM', 'database', 'INITIALIZED', 'Identity and audit schema initialized');

GRANT USAGE ON SCHEMA public TO acme_app;
GRANT SELECT, INSERT, UPDATE ON users TO acme_app;
GRANT SELECT, INSERT ON audit_logs TO acme_app;
GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO acme_app;
REVOKE ALL ON FUNCTION block_immutable_change() FROM PUBLIC;
ALTER ROLE acme_app SET statement_timeout = '5s';
ALTER ROLE acme_app SET idle_in_transaction_session_timeout = '10s';
