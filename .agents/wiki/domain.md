# Domain Wiki

## Core Concepts

**Exercise** — a movement with metadata: `load_type` (reps | duration), `prescription_mode` (weighted | bodyweight | weighted_bodyweight), `default_sets`, `category`.

**WorkoutSession** — one training session. `status`: `in_progress` | `completed`.

**WorkoutExercise** — join between session and exercise. Holds `sort_order`.

**WorkoutSet** — one set within a workout exercise. Fields: `reps`, `weight_kg`, `duration_seconds`, `rpe` (6–10), `completed` (bool).

**Template** — saved workout plan. Has `TemplateExercise` rows with targets (`target_sets`, `target_reps`, `target_weight_kg`, `rest_seconds`).

**SyncQueue** — Dexie table of pending mutations: `{ id, table, operation, payload, created_at }`.

## Dexie Schema (db.ts)
```
exercises            id, name, category, load_type, prescription_mode, default_sets
workout_sessions     id, started_at, completed_at, status
workout_exercises    id, session_id, exercise_id, sort_order
workout_sets         id, workout_exercise_id, set_number, reps, weight_kg, duration_seconds, rpe, completed
templates            id, name, description, created_at
template_exercises   id, template_id, exercise_id, sort_order, target_sets, target_reps, target_weight_kg, rest_seconds
sync_queue           id, table, operation, payload, created_at
```

## Seed Data
- 30 exercises in `data/seed-exercises.ts`
- 15 bodyweight progressions (chains of related exercises)
- Loaded once on first visit by `useSeedExercises` — guard checks `exercises` table empty

## RPE Scale
Values: 6, 7, 8, 9, 10. Exported as `RPE_SCALE` from `types/index.ts`.
