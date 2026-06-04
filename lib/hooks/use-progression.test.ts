import "fake-indexeddb/auto"
import { renderHook, waitFor } from "@testing-library/react"
import { db } from "@/lib/db"
import { useProgression } from "./use-progression"
import type { Exercise, WorkoutSession, WorkoutExercise, WorkoutSet } from "@/types"

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex-1",
    name: "Bench Press",
    mechanics: "compound",
    movement_pattern: "push",
    resistance_type: "barbell",
    load_type: "reps",
    muscle_group_primary: "chest",
    muscle_group_secondary: null,
    prescription_mode: "weight_reps",
    default_sets: 3,
    default_reps_min: 8,
    default_reps_max: 12,
    default_duration_secs: null,
    bodyweight_progression_id: null,
    equipment_required: ["barbell", "bench"],
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    duration_secs: 1800,
    pre_workout_calories: null,
    calories_burned_estimate: null,
    notes: null,
    ...overrides,
  }
}

function makeWorkoutExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    id: `we-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    session_id: "",
    exercise_id: "",
    sort_order: 1,
    notes: null,
    ...overrides,
  }
}

function makeSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    workout_exercise_id: "",
    set_number: 1,
    reps: null,
    weight_kg: null,
    duration_secs: null,
    rpe: 8,
    set_type: "normal",
    is_completed: true,
    ...overrides,
  }
}

beforeEach(async () => {
  await db.exercises.clear()
  await db.workout_sessions.clear()
  await db.workout_exercises.clear()
  await db.workout_sets.clear()
  await db.bodyweight_progressions.clear()
})

afterAll(() => {
  db.close()
})

describe("useProgression", () => {
  it("returns maintain when exercise has no history", async () => {
    await db.exercises.add(makeExercise({ id: "ex-1" }))

    const { result } = renderHook(() => useProgression("ex-1"))
    await waitFor(() => {
      expect(result.current).toBeDefined()
      expect(result.current?.action).toBe("maintain")
    })
  })

  it("returns increase_weight when all sets hit max reps", async () => {
    await db.exercises.add(makeExercise({ id: "ex-1", name: "Bench Press", default_reps_min: 8, default_reps_max: 12 }))
    const session = makeSession({ id: "s-1" })
    await db.workout_sessions.add(session)
    await db.workout_exercises.add(makeWorkoutExercise({ id: "we-1", session_id: "s-1", exercise_id: "ex-1" }))
    await db.workout_sets.bulkAdd([
      makeSet({ workout_exercise_id: "we-1", set_number: 1, reps: 12, weight_kg: 50, is_completed: true }),
      makeSet({ workout_exercise_id: "we-1", set_number: 2, reps: 12, weight_kg: 50, is_completed: true }),
      makeSet({ workout_exercise_id: "we-1", set_number: 3, reps: 12, weight_kg: 50, is_completed: true }),
    ])

    const { result } = renderHook(() => useProgression("ex-1"))
    await waitFor(() => {
      expect(result.current?.action).toBe("increase_weight")
      expect(result.current?.new_weight_kg).toBe(52.5)
    })
  })

  it("returns maintain when sets are mixed", async () => {
    await db.exercises.add(makeExercise({ id: "ex-1", default_reps_min: 8, default_reps_max: 12 }))
    const session = makeSession({ id: "s-2" })
    await db.workout_sessions.add(session)
    await db.workout_exercises.add(makeWorkoutExercise({ id: "we-2", session_id: "s-2", exercise_id: "ex-1" }))
    await db.workout_sets.bulkAdd([
      makeSet({ workout_exercise_id: "we-2", set_number: 1, reps: 10, weight_kg: 50, is_completed: true }),
      makeSet({ workout_exercise_id: "we-2", set_number: 2, reps: 11, weight_kg: 50, is_completed: true }),
    ])

    const { result } = renderHook(() => useProgression("ex-1"))
    await waitFor(() => {
      expect(result.current?.action).toBe("maintain")
    })
  })

  it("returns advance_variation for bodyweight exercises", async () => {
    await db.exercises.add(makeExercise({
      id: "incline-push-up",
      name: "Incline Push-up",
      resistance_type: "bodyweight",
      prescription_mode: "bodyweight_reps",
      default_reps_min: 10,
      default_reps_max: 15,
      bodyweight_progression_id: "prog-push",
    }))
    await db.bodyweight_progressions.bulkAdd([
      { id: "prog-push-1", exercise_id: "incline-push-up", variation_name: "Incline Push-up", sort_order: 1 },
      { id: "prog-push-2", exercise_id: "push-up", variation_name: "Standard Push-up", sort_order: 2 },
    ])

    const session = makeSession({ id: "s-3" })
    await db.workout_sessions.add(session)
    await db.workout_exercises.add(makeWorkoutExercise({ id: "we-3", session_id: "s-3", exercise_id: "incline-push-up" }))
    await db.workout_sets.bulkAdd([
      makeSet({ workout_exercise_id: "we-3", set_number: 1, reps: 15, is_completed: true }),
    ])

    const { result } = renderHook(() => useProgression("incline-push-up"))
    await waitFor(() => {
      expect(result.current?.action).toBe("advance_variation")
    })
  })

  it("uses only the most recent session", async () => {
    await db.exercises.add(makeExercise({ id: "ex-1", default_reps_min: 8, default_reps_max: 12 }))
    const oldSession = makeSession({ id: "s-old", completed_at: "2024-01-01T00:00:00Z" })
    const newSession = makeSession({ id: "s-new", completed_at: new Date().toISOString() })
    await db.workout_sessions.bulkAdd([oldSession, newSession])
    await db.workout_exercises.bulkAdd([
      makeWorkoutExercise({ id: "we-old", session_id: "s-old", exercise_id: "ex-1" }),
      makeWorkoutExercise({ id: "we-new", session_id: "s-new", exercise_id: "ex-1" }),
    ])
    await db.workout_sets.bulkAdd([
      makeSet({ workout_exercise_id: "we-old", set_number: 1, reps: 5, is_completed: true }),
      makeSet({ workout_exercise_id: "we-new", set_number: 1, reps: 12, weight_kg: 50, is_completed: true }),
      makeSet({ workout_exercise_id: "we-new", set_number: 2, reps: 12, weight_kg: 50, is_completed: true }),
    ])

    const { result } = renderHook(() => useProgression("ex-1"))
    await waitFor(() => {
      expect(result.current?.action).toBe("increase_weight")
    })
  })
})
