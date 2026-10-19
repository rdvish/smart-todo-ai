CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS todos (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  completed   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS subtasks (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id   UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  text      TEXT NOT NULL,
  done      BOOLEAN NOT NULL DEFAULT false,
  position  INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_subtasks_todo ON subtasks(todo_id);