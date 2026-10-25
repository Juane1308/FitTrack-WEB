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
  ADD COLUMN IF NOT EXISTS allergies TEXT[],
  -- Perfil > foto: el navegador la recorta en cuadrado y la comprime antes de subirla.
  ADD COLUMN IF NOT EXISTS avatar_data BYTEA,
  ADD COLUMN IF NOT EXISTS avatar_mime_type TEXT;

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

ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS routine_id BIGINT REFERENCES fittrack.rutinas(id);
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS workout_sessions_one_active_idx
  ON workout_sessions(user_id) WHERE completed=FALSE AND started_at IS NOT NULL;

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

-- Perfil > Mis objetivos. weekly_workouts es la meta de entrenamientos por semana
-- que usa Inicio cuando no hay una meta específica en weekly_goals.
CREATE TABLE IF NOT EXISTS user_goals (
  user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  weekly_workouts INTEGER NOT NULL DEFAULT 3 CHECK (weekly_workouts BETWEEN 1 AND 14),
  target_weight_kg NUMERIC(5, 2) CHECK (target_weight_kg IS NULL OR target_weight_kg BETWEEN 25 AND 350),
  daily_water_ml INTEGER NOT NULL DEFAULT 2000 CHECK (daily_water_ml BETWEEN 250 AND 10000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historial de peso: un registro por día. user_profiles.weight_kg guarda solo el peso actual.
CREATE TABLE IF NOT EXISTS weight_logs (
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  logged_on DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg BETWEEN 25 AND 350),
  PRIMARY KEY (user_id, logged_on)
);

-- Punto de partida para cuentas creadas antes del historial: su peso del perfil en la fecha de registro.
INSERT INTO weight_logs (user_id, logged_on, weight_kg)
SELECT p.user_id, u.created_at::DATE, p.weight_kg
FROM user_profiles p
JOIN app_users u ON u.id = p.user_id
WHERE p.weight_kg IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM weight_logs w WHERE w.user_id = p.user_id);

-- Progreso > fotos de progreso. El navegador las recorta y comprime antes de subirlas.
CREATE TABLE IF NOT EXISTS progress_photos (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  image_data BYTEA NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  taken_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS progress_photos_user_idx ON progress_photos(user_id, taken_on);

-- Perfil > Notificaciones y Privacidad.
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  workout_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_time TIME,
  water_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_summary BOOLEAN NOT NULL DEFAULT TRUE,
  news BOOLEAN NOT NULL DEFAULT FALSE,
  private_photos BOOLEAN NOT NULL DEFAULT TRUE,
  share_anonymous_data BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfil > Ayuda.
CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO faqs (id, category, question, answer, sort_order) VALUES
  ('cuenta-datos', 'Cuenta', '¿Cómo actualizo mis datos personales?',
   'Entra a Perfil > Mis datos, cambia lo que necesites y pulsa Guardar cambios. Tu peso nuevo también queda en tu historial de progreso.', 1),
  ('cuenta-contrasena', 'Cuenta', '¿Cómo cambio mi contraseña?',
   'En Perfil > Privacidad escribe tu contraseña actual y la nueva (mínimo 8 caracteres). Las demás sesiones abiertas se cierran por seguridad.', 2),
  ('objetivos-meta', 'Objetivos', '¿Para qué sirve la meta semanal?',
   'Es el número de entrenamientos que quieres completar cada semana. Inicio la usa para calcular tu porcentaje de progreso semanal.', 3),
  ('objetivos-peso', 'Objetivos', '¿Cómo se calcula mi progreso de peso?',
   'Comparamos tu primer peso registrado con el más reciente. Cada vez que actualizas tu peso se guarda un registro con la fecha del día.', 4),
  ('entrenar-rutinas', 'Entrenamiento', '¿Cómo guardo una rutina?',
   'En Entrenar > Rutinas abre la rutina que te guste y guárdala. La encontrarás después en Mis rutinas.', 5),
  ('privacidad-datos', 'Privacidad', '¿Quién puede ver mi información?',
   'Solo tú. Tus datos de salud se usan para adaptar tus recomendaciones y no se comparten a menos que actives la opción de datos anónimos.', 6)
ON CONFLICT (id) DO NOTHING;

-- Alimentación: catálogos que antes vivían solo en src/data/*.json (npm run nutrition:import).
CREATE TABLE IF NOT EXISTS nutrition_catalogs (
  id TEXT PRIMARY KEY CHECK (id IN ('foods', 'recipes')),
  source TEXT NOT NULL,
  source_url TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS food_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  source TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS foods (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES food_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories NUMERIC(7, 2) NOT NULL CHECK (calories >= 0),
  protein NUMERIC(6, 2) NOT NULL CHECK (protein >= 0),
  carbs NUMERIC(6, 2) NOT NULL CHECK (carbs >= 0),
  fat NUMERIC(6, 2) NOT NULL CHECK (fat >= 0),
  fiber NUMERIC(6, 2) CHECK (fiber IS NULL OR fiber >= 0),
  serving TEXT NOT NULL,
  benefits TEXT,
  source TEXT,
  source_url TEXT,
  image TEXT,
  image_source JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS foods_category_idx ON foods(category_id, sort_order);

CREATE TABLE IF NOT EXISTS recipe_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  source TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES recipe_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes > 0),
  servings INTEGER NOT NULL CHECK (servings > 0),
  calories NUMERIC(7, 2) NOT NULL CHECK (calories >= 0),
  protein NUMERIC(6, 2) NOT NULL CHECK (protein >= 0),
  carbs NUMERIC(6, 2) NOT NULL CHECK (carbs >= 0),
  fat NUMERIC(6, 2) NOT NULL CHECK (fat >= 0),
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  steps TEXT[] NOT NULL DEFAULT '{}',
  source TEXT,
  source_recipe_name TEXT,
  image TEXT,
  image_source JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS recipes_category_idx ON recipes(category_id, sort_order);
