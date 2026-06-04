export type Mechanics = "compound" | "isolation"
export type MovementPattern = "push" | "pull" | "squat" | "hinge" | "core" | "carry"
export type ResistanceType = "bodyweight" | "weighted_bodyweight" | "barbell" | "dumbbell" | "cable" | "machine" | "band" | "kettlebell"
export type LoadType = "reps" | "duration"
export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "quads" | "hamstrings" | "glutes" | "calves" | "abs" | "forearms" | "traps"
export type SetType = "normal" | "warmup" | "dropset" | "failure"
export type ProgressionType = "linear" | "double_progression" | "progression_variation"
export type ExercisePrescriptionMode =
  | "weight_reps" | "bodyweight_reps" | "weighted_bodyweight_reps"
  | "duration" | "bodyweight_duration"

export interface Exercise {
  id: string
  name: string
  mechanics: Mechanics
  movement_pattern: MovementPattern
  resistance_type: ResistanceType
  load_type: LoadType
  muscle_group_primary: MuscleGroup
  muscle_group_secondary: MuscleGroup | null
  prescription_mode: ExercisePrescriptionMode
  default_sets: number
  default_reps_min: number | null
  default_reps_max: number | null
  default_duration_secs: number | null
  bodyweight_progression_id: string | null
  equipment_required: string[]
  created_at: string
  updated_at?: string
}

export interface BodyweightProgression {
  id: string
  exercise_id: string
  variation_name: string
  sort_order: number
}

export interface WorkoutSession {
  id: string
  started_at: string
  completed_at: string | null
  duration_secs: number | null
  pre_workout_calories: number | null
  calories_burned_estimate: number | null
  notes: string | null
  updated_at?: string
}

export interface WorkoutExercise {
  id: string
  session_id: string
  exercise_id: string
  sort_order: number
  notes: string | null
  updated_at?: string
}

export interface WorkoutSet {
  id: string
  workout_exercise_id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  duration_secs: number | null
  rpe: number | null
  set_type: SetType
  is_completed: boolean
  updated_at?: string
}

export interface ExerciseTemplate {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at?: string
}

export interface TemplateExercise {
  id: string
  template_id: string
  exercise_id: string
  sort_order: number
  target_sets: number
  target_reps_min: number | null
  target_reps_max: number | null
  target_weight_kg: number | null
  rest_secs: number
  rest_after_exercise_secs: number
  updated_at?: string
}

export interface MuscleRecovery {
  muscle_group: MuscleGroup
  last_trained: string | null
  recovery_hours: number
  is_recovered: boolean
}

export interface ProgressiveOverloadDecision {
  action: "increase_weight" | "increase_reps" | "advance_variation" | "maintain" | "deload"
  reason: string
  new_weight_kg?: number
  new_reps_min?: number
  new_reps_max?: number
}

export interface RPEDescriptor {
  value: number
  label: string
  rir: string
  description: string
}

export const RPE_SCALE: RPEDescriptor[] = [
  { value: 6, label: "6", rir: "4 reps left", description: "Easy, warm-up territory" },
  { value: 6.5, label: "6.5", rir: "3-4 reps left", description: "Light, controlled" },
  { value: 7, label: "7", rir: "3 reps left", description: "Moderate, smooth" },
  { value: 7.5, label: "7.5", rir: "2-3 reps left", description: "Moderate-hard" },
  { value: 8, label: "8", rir: "2 reps left", description: "Hard, repeatable" },
  { value: 8.5, label: "8.5", rir: "1-2 reps left", description: "Very hard" },
  { value: 9, label: "9", rir: "1 rep left", description: "Very hard, one left" },
  { value: 9.5, label: "9.5", rir: "0-1 reps left", description: "Near max" },
  { value: 10, label: "10", rir: "0 reps left", description: "Absolute max" },
]

export type FitnessGoal = "strength" | "hypertrophy" | "endurance" | "general"
export type BodyGoal = "cutting" | "bulking" | "maintaining"
export type ExperienceLevel = "beginner" | "intermediate" | "advanced"

export interface UserProfile {
  id: "profile"
  goal: FitnessGoal
  body_goal: BodyGoal
  experience: ExperienceLevel
  days_per_week: number
  equipment: ResistanceType[]
  bodyweight_kg: number | null
  target_bodyweight_kg: number | null
  updated_at: string
}

export type SyncOperation = "insert" | "update" | "delete"

export interface SyncQueueItem {
  id: string
  table_name: string
  operation: SyncOperation
  record_id: string
  payload: unknown
  retry_count: number
  created_at: string
}
