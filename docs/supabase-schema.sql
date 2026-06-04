-- SHRED — Supabase Schema Migration
-- Run this in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/<your-project-id>/sql/new)
-- Creates all tables under the `shred` schema

-- 1. Create the schema
CREATE SCHEMA IF NOT EXISTS shred;

-- 2. Exercises — master exercise library
CREATE TABLE IF NOT EXISTS shred.exercises (
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

-- 3. Bodyweight progressions — chains of related exercises
CREATE TABLE IF NOT EXISTS shred.bodyweight_progressions (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  variation_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 4. Workout sessions
CREATE TABLE IF NOT EXISTS shred.workout_sessions (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_secs INTEGER,
  pre_workout_calories INTEGER,
  calories_burned_estimate INTEGER,
  notes TEXT,
  updated_at TEXT
);

-- 5. Workout exercises — join table between sessions and exercises
CREATE TABLE IF NOT EXISTS shred.workout_exercises (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TEXT
);

-- 6. Workout sets — individual sets within a workout exercise
CREATE TABLE IF NOT EXISTS shred.workout_sets (
  id TEXT PRIMARY KEY,
  workout_exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_kg REAL,
  duration_secs INTEGER,
  rpe REAL,
  set_type TEXT NOT NULL DEFAULT 'normal',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TEXT
);

-- 7. Exercise templates — saved workout programs
CREATE TABLE IF NOT EXISTS shred.exercise_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- 8. Template exercises — exercises within a template
CREATE TABLE IF NOT EXISTS shred.template_exercises (
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

-- 9. Sync queue — not normally synced to remote, but included if needed
CREATE TABLE IF NOT EXISTS shred.sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id TEXT,
  payload JSONB,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 10. User profile
CREATE TABLE IF NOT EXISTS shred.user_profile (
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

-- 11. Grant schema access to anon and service_role (required for PostgREST to enter the schema)
GRANT USAGE ON SCHEMA shred TO anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA shred TO anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA shred TO anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA shred GRANT ALL ON TABLES TO anon, service_role;

-- 13. Enable Row Level Security (recommended for anon key access)
ALTER TABLE shred.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE shred.bodyweight_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shred.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shred.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE shred.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE shred.exercise_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shred.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE shred.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE shred.user_profile ENABLE ROW LEVEL SECURITY;

-- 14. Allow all operations for anon key (single-user app, no auth per-se)
CREATE POLICY "Allow all on exercises" ON shred.exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bodyweight_progressions" ON shred.bodyweight_progressions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on workout_sessions" ON shred.workout_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on workout_exercises" ON shred.workout_exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on workout_sets" ON shred.workout_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on exercise_templates" ON shred.exercise_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on template_exercises" ON shred.template_exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sync_queue" ON shred.sync_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on user_profile" ON shred.user_profile FOR ALL USING (true) WITH CHECK (true);

-- 15. Expose the shred schema to PostgREST
-- NOTE: This step may need to be done via Supabase Dashboard > Settings > API > Exposed Schemas
-- Add "shred" to the list of exposed schemas (comma-separated: "public,graphql_public,shred")
