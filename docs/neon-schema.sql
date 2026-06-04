-- SHRED — Neon Schema
-- Run once in Neon SQL Editor (console.neon.tech)

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mechanics TEXT NOT NULL,
  movement_pattern TEXT NOT NULL,
  resistance_type TEXT NOT NULL,
  load_type TEXT NOT NULL,
  muscle_group_primary TEXT NOT NULL,
  muscle_group_secondary TEXT,
  prescription_mode TEXT NOT NULL,
  default_sets INTEGER NOT NULL DEFAULT 3,
  default_reps_min INTEGER,
  default_reps_max INTEGER,
  default_duration_secs INTEGER,
  bodyweight_progression_id TEXT,
  equipment_required JSONB DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS bodyweight_progressions (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  variation_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_secs INTEGER,
  pre_workout_calories INTEGER,
  calories_burned_estimate INTEGER,
  notes TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id TEXT PRIMARY KEY,
  workout_exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_kg REAL,
  duration_secs INTEGER,
  rpe REAL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS exercise_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS template_exercises (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps_min INTEGER,
  target_reps_max INTEGER,
  target_weight_kg REAL,
  rest_secs INTEGER NOT NULL DEFAULT 90,
  rest_after_exercise_secs INTEGER NOT NULL DEFAULT 180,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY DEFAULT 'profile',
  goal TEXT NOT NULL DEFAULT 'hypertrophy',
  body_goal TEXT NOT NULL DEFAULT 'maintaining',
  experience TEXT NOT NULL DEFAULT 'beginner',
  days_per_week INTEGER NOT NULL DEFAULT 4,
  equipment JSONB DEFAULT '["bodyweight"]',
  bodyweight_kg REAL,
  target_bodyweight_kg REAL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  succeeded BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts (ip, attempted_at);
