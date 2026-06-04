import Dexie, { type Table } from "dexie"
import type {
  Exercise,
  BodyweightProgression,
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  ExerciseTemplate,
  TemplateExercise,
  SyncQueueItem,
  UserProfile,
} from "@/types"

export class ShredDB extends Dexie {
  exercises!: Table<Exercise, string>
  bodyweight_progressions!: Table<BodyweightProgression, string>
  workout_sessions!: Table<WorkoutSession, string>
  workout_exercises!: Table<WorkoutExercise, string>
  workout_sets!: Table<WorkoutSet, string>
  exercise_templates!: Table<ExerciseTemplate, string>
  template_exercises!: Table<TemplateExercise, string>
  sync_queue!: Table<SyncQueueItem, string>
  user_profile!: Table<UserProfile, string>

  constructor() {
    super("shred")
    this.version(1).stores({
      exercises: "id, name, muscle_group_primary, movement_pattern, resistance_type",
      bodyweight_progressions: "id, exercise_id, sort_order",
      workout_sessions: "id, started_at, completed_at",
      workout_exercises: "id, session_id, exercise_id, sort_order",
      workout_sets: "id, workout_exercise_id, set_number",
      exercise_templates: "id, name",
      template_exercises: "id, template_id, exercise_id",
      sync_queue: "id, table_name, operation, created_at",
    })
    this.version(2).stores({
      exercises: "id, name, muscle_group_primary, movement_pattern, resistance_type",
      bodyweight_progressions: "id, exercise_id, sort_order",
      workout_sessions: "id, started_at, completed_at",
      workout_exercises: "id, session_id, exercise_id, sort_order",
      workout_sets: "id, workout_exercise_id, set_number",
      exercise_templates: "id, name",
      template_exercises: "id, template_id, exercise_id",
      sync_queue: "id, table_name, operation, created_at",
      user_profile: "id",
    })
    this.version(3).stores({
      exercises: "id, name, muscle_group_primary, movement_pattern, resistance_type",
      bodyweight_progressions: "id, exercise_id, sort_order",
      workout_sessions: "id, started_at, completed_at",
      workout_exercises: "id, session_id, exercise_id, sort_order",
      workout_sets: "id, workout_exercise_id, set_number",
      exercise_templates: "id, name",
      template_exercises: "id, template_id, exercise_id",
      sync_queue: "id, table_name, operation, created_at",
      user_profile: "id",
    }).upgrade((tx) => {
      return tx.table("template_exercises").toCollection().modify((te) => {
        if (te.rest_after_exercise_secs === undefined) {
          te.rest_after_exercise_secs = 180
        }
      })
    })
  }
}

export const db = new ShredDB()
