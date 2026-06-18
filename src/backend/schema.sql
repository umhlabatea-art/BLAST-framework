-- BLAST schema. Portable across PostgreSQL and Supabase.
-- IDs and timestamps are supplied by the application layer so this schema does
-- not depend on database-specific functions (gen_random_uuid, etc.).

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL,
  session_id  TEXT,
  amount      INTEGER,
  currency    TEXT,
  status      TEXT,
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments (session_id);
