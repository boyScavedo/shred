# SHRED — Data Model

## Core Types (types/index.ts)

### Exercise
```
id, name, mechanics (compound|isolation), movement_pattern (push|pull|squat|hinge|core|carry),
resistance_type (bodyweight|weighted_bodyweight|barbell|dumbbell|cable|machine|band|kettlebell),
load_type (reps|duration), muscle_group_primary, muscle_group_secondary,
prescription_mode (weight_reps|bodyweight_reps|weighted_bodyweight_reps|duration|bodyweight_duration),
default_sets, default_reps_min, default_reps_max, default_duration_secs,
bodyweight_progression_id, equipment_required[], created_at
```

### BodyweightProgression
```
id, exercise_id, variation_name, sort_order
```

### WorkoutSession
```
id, started_at, completed_at, duration_secs, pre_workout_calories, 
calories_burned_estimate, notes
```

### WorkoutExercise
```
id, session_id, exercise_id, sort_order, notes
```

### WorkoutSet
```
id, workout_exercise_id, set_number, reps, weight_kg, duration_secs,
rpe, set_type (normal|warmup|dropset|failure), is_completed
```

### ExerciseTemplate / TemplateExercise
Pre-built workout templates with target reps/sets/weight and rest times.

### SyncQueueItem
```
id, table_name, operation (insert|update|delete), record_id, payload, retry_count, created_at
```

## IndexedDB Schema (lib/db.ts)
- `exercises` — key: id, indexes: name, muscle_group_primary, movement_pattern, resistance_type
- `bodyweight_progressions` — key: id, indexes: exercise_id, sort_order
- `workout_sessions` — key: id, indexes: started_at, completed_at
- `workout_exercises` — key: id, indexes: session_id, exercise_id, sort_order
- `workout_sets` — key: id, indexes: workout_exercise_id, set_number
- `exercise_templates` — key: id, indexes: name
- `template_exercises` — key: id, indexes: template_id, exercise_id
- `sync_queue` — key: id, indexes: table_name, operation, created_at

## Supabase Schema (shred.*)
All IndexedDB tables are mirrored under the `shred` schema in Supabase.
The sync engine writes to `shred.<table_name>` using the anon key.
See `docs/supabase-schema.sql` for the full DDL and RLS policies.

## RPE Scale (starts at 6)
| RPE | RIR | Description |
|-----|-----|-------------|
| 6 | 4 reps left | Easy, warm-up territory |
| 6.5 | 3-4 reps left | Light, controlled |
| 7 | 3 reps left | Moderate, smooth |
| 7.5 | 2-3 reps left | Moderate-hard |
| 8 | 2 reps left | Hard, repeatable (TARGET) |
| 8.5 | 1-2 reps left | Very hard |
| 9 | 1 rep left | Very hard, one left |
| 9.5 | 0-1 reps left | Near max |
| 10 | 0 reps left | Absolute max |
