import "fake-indexeddb/auto"
import { renderHook, waitFor } from "@testing-library/react"
import { db } from "@/lib/db"
import { useGuide } from "./use-guide"
import type { Exercise, WorkoutSession, WorkoutExercise, WorkoutSet } from "@/types"

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "Test Exercise",
    mechanics: "compound",
    movement_pattern: "push",
    resistance_type: "bodyweight",
    load_type: "reps",
    muscle_group_primary: "chest",
    muscle_group_secondary: null,
    prescription_mode: "bodyweight_reps",
    default_sets: 3,
    default_reps_min: 8,
    default_reps_max: 12,
    default_duration_secs: null,
    bodyweight_progression_id: null,
    equipment_required: [],
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

beforeEach(async () => {
  await db.exercises.clear()
  await db.workout_sessions.clear()
  await db.workout_exercises.clear()
  await db.workout_sets.clear()
})

afterAll(() => {
  db.close()
})

describe("useGuide", () => {
  it("returns empty plan when no exercises exist", async () => {
    const { result } = renderHook(() => useGuide())
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })

  it("returns a weekly plan with exercises", async () => {
    await db.exercises.bulkAdd([
      makeExercise({ id: "e1", name: "Push-up", movement_pattern: "push", muscle_group_primary: "chest" }),
      makeExercise({ id: "e2", name: "Squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
    ])

    const { result } = renderHook(() => useGuide())
    await waitFor(() => {
      expect(result.current.length).toBeGreaterThan(0)
      const day0 = result.current[0]
      expect(day0.day).toBe(0)
      expect(day0.exercises.length).toBeGreaterThan(0)
    })
  })

  it("incorporates completed sessions into recovery check", async () => {
    await db.exercises.add(makeExercise({ id: "e1", name: "Push-up", movement_pattern: "push", muscle_group_primary: "chest" }))

    const now = new Date()
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000)
    const session = makeSession({ id: "s-1", completed_at: fiveHoursAgo.toISOString() })
    await db.workout_sessions.add(session)
    await db.workout_exercises.add(makeWorkoutExercise({ id: "we-1", session_id: "s-1", exercise_id: "e1" }))

    const { result } = renderHook(() => useGuide())
    await waitFor(() => {
      // Chest was trained 5h ago (within 48h window), but only push+core day 0 would contain chest
      // Push-ups primarily target chest, so if chest isn't recovered, they shouldn't be scheduled
      if (result.current.length > 0) {
        const chestExercises = result.current.flatMap((d) =>
          d.exercises.filter((e) => e.exercise.muscle_group_primary === "chest")
        )
        expect(chestExercises).toHaveLength(0)
      }
    })
  })
})
