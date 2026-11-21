CREATE TABLE auth_rate_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email_hash text NOT NULL,
  ip_hash text NOT NULL,
  action text NOT NULL CHECK (action IN ('ISSUE','VERIFY')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX auth_rate_email ON auth_rate_events(email_hash,created_at);
CREATE INDEX auth_rate_ip ON auth_rate_events(ip_hash,created_at);
GRANT SELECT,INSERT ON auth_rate_events TO acme_app;
GRANT USAGE,SELECT ON SEQUENCE auth_rate_events_id_seq TO acme_app;
