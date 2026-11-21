CREATE TABLE login_challenges (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  secret_hash text NOT NULL CHECK (secret_hash ~ '^[a-f0-9]{64}$'),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '15 minutes')
);
CREATE UNIQUE INDEX login_challenge_live_user ON login_challenges(user_id) WHERE consumed_at IS NULL;
CREATE TABLE user_sessions (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid NOT NULL REFERENCES users(id),
  csrf_hash text NOT NULL CHECK (csrf_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (last_seen_at >= created_at)
);
CREATE INDEX user_sessions_user ON user_sessions(user_id);
GRANT SELECT, INSERT, UPDATE ON login_challenges, user_sessions TO acme_app;
