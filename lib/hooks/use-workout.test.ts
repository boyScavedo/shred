import "fake-indexeddb/auto"
import { renderHook, act, waitFor } from "@testing-library/react"
import { db } from "@/lib/db"
import { useActiveWorkout, useStartWorkout, useCompleteWorkout, useWorkoutExercises, useWorkoutSets, useAddExerciseToWorkout, useRemoveExerciseFromWorkout, useUpdateSet, useAddSet } from "./use-workout"
import type { WorkoutSession, WorkoutExercise, WorkoutSet, Exercise } from "@/types"

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    started_at: new Date().toISOString(),
    completed_at: null,
    duration_secs: null,
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
    sort_order: 0,
    notes: null,
    ...overrides,
  }
}

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

function makeSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    workout_exercise_id: "",
    set_number: 1,
    reps: null,
    weight_kg: null,
    duration_secs: null,
    rpe: null,
    set_type: "normal",
    is_completed: false,
    ...overrides,
  }
}

beforeEach(async () => {
  await db.workout_sessions.clear()
  await db.workout_exercises.clear()
  await db.workout_sets.clear()
  await db.exercises.clear()
})

afterAll(() => {
  db.close()
})

describe("useActiveWorkout", () => {
  it("returns undefined when no active workout", async () => {
    const { result } = renderHook(() => useActiveWorkout())
    await waitFor(() => expect(result.current.session).toBeUndefined())
  })

  it("returns the active (incomplete) workout", async () => {
    await db.workout_sessions.add(makeSession({ id: "s-active" }))

    const { result } = renderHook(() => useActiveWorkout())
    await waitFor(() => {
      expect(result.current.session).toBeDefined()
      expect(result.current.session?.id).toBe("s-active")
    })
  })

  it("does not return completed workouts", async () => {
    await db.workout_sessions.add(makeSession({ id: "s-complete", completed_at: new Date().toISOString() }))

    const { result } = renderHook(() => useActiveWorkout())
    await waitFor(() => expect(result.current.session).toBeUndefined())
  })
})

describe("useStartWorkout", () => {
  it("creates a new workout session", async () => {
    const { result } = renderHook(() => useStartWorkout())

    let sessionId: string | undefined
    await act(async () => {
      sessionId = await result.current.mutate()
    })

    expect(sessionId).toBeDefined()
    const stored = await db.workout_sessions.get(sessionId!)
    expect(stored).toBeDefined()
    expect(stored?.completed_at).toBeNull()
  })
})

describe("useCompleteWorkout", () => {
  it("marks a workout as completed", async () => {
    await db.workout_sessions.add(makeSession({ id: "s-to-complete" }))

    const { result } = renderHook(() => useCompleteWorkout())

    await act(async () => {
      await result.current.mutate("s-to-complete")
    })

    const stored = await db.workout_sessions.get("s-to-complete")
    expect(stored?.completed_at).not.toBeNull()
  })
})

describe("useWorkoutExercises", () => {
  it("returns exercises for a session in order", async () => {
    await db.workout_exercises.bulkAdd([
      makeWorkoutExercise({ id: "we-1", session_id: "s-1", exercise_id: "ex-1", sort_order: 2 }),
      makeWorkoutExercise({ id: "we-2", session_id: "s-1", exercise_id: "ex-2", sort_order: 1 }),
    ])

    const { result } = renderHook(() => useWorkoutExercises("s-1"))
    await waitFor(() => {
      expect(result.current.exercises).toHaveLength(2)
      expect(result.current.exercises[0].sort_order).toBe(1)
      expect(result.current.exercises[1].sort_order).toBe(2)
    })
  })

  it("returns empty array for session with no exercises", async () => {
    const { result } = renderHook(() => useWorkoutExercises("s-empty"))
    await waitFor(() => expect(result.current.exercises).toEqual([]))
  })
})

describe("useWorkoutSets", () => {
  it("returns sets for a workout exercise", async () => {
    await db.workout_sets.bulkAdd([
      makeSet({ id: "set-1", workout_exercise_id: "we-1", set_number: 1, reps: 10 }),
      makeSet({ id: "set-2", workout_exercise_id: "we-1", set_number: 2, reps: 8 }),
    ])

    const { result } = renderHook(() => useWorkoutSets("we-1"))
    await waitFor(() => {
      expect(result.current).toHaveLength(2)
      expect(result.current[0].reps).toBe(10)
      expect(result.current[1].reps).toBe(8)
    })
  })
})

describe("useAddExerciseToWorkout", () => {
  it("adds exercise to the session and creates empty sets", async () => {
    await db.exercises.add(makeExercise({ id: "ex-1", default_sets: 3 }))

    const { result } = renderHook(() => useAddExerciseToWorkout())

    let weId: string | undefined
    await act(async () => {
      weId = await result.current.mutate({ sessionId: "s-1", exerciseId: "ex-1" })
    })

    expect(weId).toBeDefined()
    const stored = await db.workout_exercises.get(weId!)
    expect(stored).toBeDefined()
    expect(stored?.session_id).toBe("s-1")
    expect(stored?.exercise_id).toBe("ex-1")

    const sets = await db.workout_sets.where("workout_exercise_id").equals(weId!).toArray()
    expect(sets).toHaveLength(3)
    const sorted = [...sets].sort((a, b) => a.set_number - b.set_number)
    expect(sorted.map((s) => s.set_number)).toEqual([1, 2, 3])
    expect(sets.every((s) => s.set_type === "normal")).toBe(true)
    expect(sets.every((s) => s.is_completed === false)).toBe(true)
  })

  it("auto-increments sort_order", async () => {
    await db.exercises.add(makeExercise({ id: "ex-1", default_sets: 0 }))
    await db.workout_exercises.add(makeWorkoutExercise({ id: "we-1", session_id: "s-1", exercise_id: "ex-1", sort_order: 1 }))

    const { result } = renderHook(() => useAddExerciseToWorkout())

    await act(async () => {
      await result.current.mutate({ sessionId: "s-1", exerciseId: "ex-2" })
    })

    const all = await db.workout_exercises.where("session_id").equals("s-1").toArray()
    expect(all).toHaveLength(2)
    const sorted = [...all].sort((a, b) => a.sort_order - b.sort_order)
    expect(sorted[1].sort_order).toBe(2)
  })

  it("does not create sets for exercises with default_sets=0", async () => {
    await db.exercises.add(makeExercise({ id: "ex-0", default_sets: 0 }))

    const { result } = renderHook(() => useAddExerciseToWorkout())

    let weId: string | undefined
    await act(async () => {
      weId = await result.current.mutate({ sessionId: "s-2", exerciseId: "ex-0" })
    })

    const sets = await db.workout_sets.where("workout_exercise_id").equals(weId!).toArray()
    expect(sets).toHaveLength(0)
  })
})

describe("useRemoveExerciseFromWorkout", () => {
  it("removes exercise and its sets", async () => {
    await db.workout_exercises.add(makeWorkoutExercise({ id: "we-to-remove", session_id: "s-1" }))
    await db.workout_sets.add(makeSet({ workout_exercise_id: "we-to-remove" }))

    const { result } = renderHook(() => useRemoveExerciseFromWorkout())

    await act(async () => {
      await result.current.mutate("we-to-remove")
    })

    const stored = await db.workout_exercises.get("we-to-remove")
    expect(stored).toBeUndefined()

    const sets = await db.workout_sets.where("workout_exercise_id").equals("we-to-remove").toArray()
    expect(sets).toHaveLength(0)
  })
})

describe("useUpdateSet", () => {
  it("updates a set", async () => {
    await db.workout_sets.add(makeSet({ id: "set-upd", reps: 5 }))

    const { result } = renderHook(() => useUpdateSet())

    await act(async () => {
      await result.current.mutate({ id: "set-upd", reps: 10, is_completed: true })
    })

    const stored = await db.workout_sets.get("set-upd")
    expect(stored?.reps).toBe(10)
    expect(stored?.is_completed).toBe(true)
  })

  it("adds a new set if it does not exist", async () => {
    const { result } = renderHook(() => useUpdateSet())

    await act(async () => {
      await result.current.mutate({
        id: "new-set",
        workout_exercise_id: "we-1",
        set_number: 1,
        reps: 12,
        is_completed: true,
        set_type: "normal",
      } as WorkoutSet)
    })

    const stored = await db.workout_sets.get("new-set")
    expect(stored).toBeDefined()
    expect(stored?.reps).toBe(12)
  })
})

describe("useAddSet", () => {
  it("creates a set with incremented set_number", async () => {
    await db.workout_sets.bulkAdd([
      makeSet({ id: "set-1", workout_exercise_id: "we-1", set_number: 1 }),
      makeSet({ id: "set-2", workout_exercise_id: "we-1", set_number: 2 }),
    ])

    const { result } = renderHook(() => useAddSet())

    let setId: string | undefined
    await act(async () => {
      setId = await result.current.mutate("we-1")
    })

    expect(setId).toBeDefined()
    const stored = await db.workout_sets.get(setId!)
    expect(stored).toBeDefined()
    expect(stored?.workout_exercise_id).toBe("we-1")
    expect(stored?.set_number).toBe(3)
    expect(stored?.set_type).toBe("normal")
    expect(stored?.is_completed).toBe(false)
  })

  it("creates set_number 1 when no sets exist", async () => {
    const { result } = renderHook(() => useAddSet())

    let setId: string | undefined
    await act(async () => {
      setId = await result.current.mutate("we-1")
    })

    const stored = await db.workout_sets.get(setId!)
    expect(stored?.set_number).toBe(1)
  })
})
