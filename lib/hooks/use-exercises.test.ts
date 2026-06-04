import "fake-indexeddb/auto"
import { renderHook, act, waitFor } from "@testing-library/react"
import { db } from "@/lib/db"
import { useExercises, useExercise, useAddExercise, useUpdateExercise, useDeleteExercise } from "./use-exercises"
import type { Exercise } from "@/types"

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

beforeEach(async () => {
  await db.exercises.clear()
})

afterAll(() => {
  db.close()
})

describe("useExercises", () => {
  it("returns empty array when no exercises exist", async () => {
    const { result } = renderHook(() => useExercises())
    await waitFor(() => expect(result.current).toEqual([]))
  })

  it("returns all exercises from the database", async () => {
    const ex = makeExercise({ name: "Push-up" })
    await db.exercises.add(ex)

    const { result } = renderHook(() => useExercises())
    await waitFor(() => {
      expect(result.current).toHaveLength(1)
      expect(result.current[0].name).toBe("Push-up")
    })
  })

  it("filters by muscle_group_primary", async () => {
    await db.exercises.bulkAdd([
      makeExercise({ id: "e1", name: "Push-up", muscle_group_primary: "chest" }),
      makeExercise({ id: "e2", name: "Squat", muscle_group_primary: "quads" }),
    ])

    const { result } = renderHook(() => useExercises({ muscleGroup: "chest" }))
    await waitFor(() => {
      expect(result.current).toHaveLength(1)
      expect(result.current[0].name).toBe("Push-up")
    })
  })

  it("filters by movement_pattern", async () => {
    await db.exercises.bulkAdd([
      makeExercise({ id: "e1", name: "Push-up", movement_pattern: "push" }),
      makeExercise({ id: "e2", name: "Squat", movement_pattern: "squat" }),
    ])

    const { result } = renderHook(() => useExercises({ movementPattern: "squat" }))
    await waitFor(() => {
      expect(result.current).toHaveLength(1)
      expect(result.current[0].name).toBe("Squat")
    })
  })
})

describe("useExercise", () => {
  it("returns undefined when exercise does not exist", async () => {
    const { result } = renderHook(() => useExercise("nonexistent"))
    await waitFor(() => expect(result.current).toBeUndefined())
  })

  it("returns the exercise by id", async () => {
    const ex = makeExercise({ id: "ex-123", name: "Bench Press" })
    await db.exercises.add(ex)

    const { result } = renderHook(() => useExercise("ex-123"))
    await waitFor(() => {
      expect(result.current).toBeDefined()
      expect(result.current?.name).toBe("Bench Press")
    })
  })
})

describe("useAddExercise", () => {
  it("adds an exercise to the database", async () => {
    const { result } = renderHook(() => useAddExercise())

    let addedId: string | undefined
    await act(async () => {
      addedId = await result.current.mutate(makeExercise({ id: "new-ex", name: "New Exercise" }))
    })

    const stored = await db.exercises.get("new-ex")
    expect(stored).toBeDefined()
    expect(stored?.name).toBe("New Exercise")
    expect(addedId).toBe("new-ex")
  })
})

describe("useUpdateExercise", () => {
  it("updates an existing exercise", async () => {
    await db.exercises.add(makeExercise({ id: "ex-upd", name: "Old Name" }))

    const { result } = renderHook(() => useUpdateExercise())

    await act(async () => {
      await result.current.mutate({ id: "ex-upd", name: "New Name" })
    })

    const stored = await db.exercises.get("ex-upd")
    expect(stored?.name).toBe("New Name")
  })
})

describe("useDeleteExercise", () => {
  it("deletes an exercise from the database", async () => {
    await db.exercises.add(makeExercise({ id: "ex-del", name: "To Delete" }))

    const { result } = renderHook(() => useDeleteExercise())

    await act(async () => {
      await result.current.mutate("ex-del")
    })

    const stored = await db.exercises.get("ex-del")
    expect(stored).toBeUndefined()
  })
})
