CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  goal TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS weekly_goals (
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  target_workouts INTEGER NOT NULL CHECK (target_workouts >= 0),
  PRIMARY KEY (user_id, week_start)
);

CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  scheduled_for DATE NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  difficulty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS routines_user_date_idx ON routines(user_id, scheduled_for);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  performed_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  calories_burned INTEGER CHECK (calories_burned >= 0),
  completed BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS workout_sessions_user_date_idx
  ON workout_sessions(user_id, performed_at);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL,
  calories INTEGER CHECK (calories >= 0),
  protein_grams NUMERIC(8, 2),
  carbohydrates_grams NUMERIC(8, 2),
  fats_grams NUMERIC(8, 2)
);

CREATE INDEX IF NOT EXISTS nutrition_logs_user_date_idx
  ON nutrition_logs(user_id, logged_at);
