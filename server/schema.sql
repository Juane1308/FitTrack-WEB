CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  goal TEXT,
  birth_date DATE,
  weight_kg NUMERIC(5, 2) CHECK (weight_kg IS NULL OR weight_kg BETWEEN 25 AND 350),
  height_cm NUMERIC(5, 2) CHECK (height_cm IS NULL OR height_cm BETWEEN 100 AND 250),
  sport_experience TEXT,
  training_location TEXT,
  injuries TEXT[],
  joint_pains TEXT[],
  surgeries TEXT[],
  chronic_conditions TEXT[],
  allergies TEXT[]
);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS sport_experience TEXT,
  ADD COLUMN IF NOT EXISTS training_location TEXT,
  ADD COLUMN IF NOT EXISTS injuries TEXT[],
  ADD COLUMN IF NOT EXISTS joint_pains TEXT[],
  ADD COLUMN IF NOT EXISTS surgeries TEXT[],
  ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[],
  ADD COLUMN IF NOT EXISTS allergies TEXT[];

ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS onboarding_completed,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at;

INSERT INTO user_profiles (user_id)
SELECT id FROM app_users
ON CONFLICT (user_id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'app_users'
      AND column_name = 'goal'
  ) THEN
    UPDATE user_profiles AS profile
    SET goal = CASE lower(trim(users.goal))
      WHEN 'perder peso' THEN 'lose_weight'
      WHEN 'bajar de peso' THEN 'lose_weight'
      WHEN 'ganar masa muscular' THEN 'gain_muscle'
      WHEN 'mantenerme en forma' THEN 'stay_fit'
      WHEN 'mantenerse en forma' THEN 'stay_fit'
      WHEN 'mejorar mi salud' THEN 'improve_health'
      WHEN 'mejorar salud' THEN 'improve_health'
      WHEN 'definir objetivo' THEN NULL
      ELSE users.goal
    END
    FROM app_users AS users
    WHERE profile.user_id = users.id AND users.goal IS NOT NULL;

    ALTER TABLE app_users DROP COLUMN goal;
  END IF;
END $$;

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

-- Accounts authenticated by this API use public.app_users (TEXT ids), while
-- fittrack.usuario_rutinas references the separate fittrack.usuarios accounts.
CREATE TABLE IF NOT EXISTS public.user_routines (
  user_id TEXT NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  routine_id BIGINT NOT NULL REFERENCES fittrack.rutinas(id) ON DELETE CASCADE,
  origin TEXT NOT NULL DEFAULT 'saved' CHECK (origin IN ('saved', 'assigned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, routine_id)
);
