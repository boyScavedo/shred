import "fake-indexeddb/auto"
import { renderHook, act, waitFor } from "@testing-library/react"
import { db } from "@/lib/db"
import {
  useTemplates,
  useTemplate,
  useTemplateExercises,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useAddTemplateExercise,
  useRemoveTemplateExercise,
  useUpdateTemplateExercise,
  useStartWorkoutFromTemplate,
} from "./use-templates"
import type { ExerciseTemplate, TemplateExercise, Exercise } from "@/types"

function makeTemplate(overrides: Partial<ExerciseTemplate> = {}): ExerciseTemplate {
  return {
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "Test Template",
    description: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeTemplateExercise(overrides: Partial<TemplateExercise> = {}): TemplateExercise {
  return {
    id: `te-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    template_id: "",
    exercise_id: "",
    sort_order: 0,
    target_sets: 3,
    target_reps_min: 8,
    target_reps_max: 12,
    target_weight_kg: null,
    rest_secs: 90,
    rest_after_exercise_secs: 180,
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

beforeEach(async () => {
  await db.exercise_templates.clear()
  await db.template_exercises.clear()
  await db.exercises.clear()
  await db.workout_sessions.clear()
  await db.workout_exercises.clear()
  await db.workout_sets.clear()
})

afterAll(() => {
  db.close()
})

describe("useTemplates", () => {
  it("returns empty array when no templates exist", async () => {
    const { result } = renderHook(() => useTemplates())
    await waitFor(() => expect(result.current).toEqual([]))
  })

  it("returns all templates sorted by created_at descending", async () => {
    await db.exercise_templates.bulkAdd([
      makeTemplate({ id: "t-1", name: "Older", created_at: "2024-01-01T00:00:00Z" }),
      makeTemplate({ id: "t-2", name: "Newer", created_at: "2024-06-01T00:00:00Z" }),
    ])

    const { result } = renderHook(() => useTemplates())
    await waitFor(() => {
      expect(result.current).toHaveLength(2)
      expect(result.current[0].name).toBe("Newer")
      expect(result.current[1].name).toBe("Older")
    })
  })
})

describe("useTemplate", () => {
  it("returns undefined when template does not exist", async () => {
    const { result } = renderHook(() => useTemplate("nonexistent"))
    await waitFor(() => expect(result.current).toBeUndefined())
  })

  it("returns the template by id", async () => {
    await db.exercise_templates.add(makeTemplate({ id: "t-1", name: "Push Day" }))

    const { result } = renderHook(() => useTemplate("t-1"))
    await waitFor(() => {
      expect(result.current).toBeDefined()
      expect(result.current?.name).toBe("Push Day")
    })
  })
})

describe("useTemplateExercises", () => {
  it("returns exercises for a template in sort_order", async () => {
    await db.template_exercises.bulkAdd([
      makeTemplateExercise({ id: "te-1", template_id: "t-1", exercise_id: "ex-1", sort_order: 2, target_sets: 4 }),
      makeTemplateExercise({ id: "te-2", template_id: "t-1", exercise_id: "ex-2", sort_order: 1, target_sets: 3 }),
    ])

    const { result } = renderHook(() => useTemplateExercises("t-1"))
    await waitFor(() => {
      expect(result.current).toHaveLength(2)
      expect(result.current[0].sort_order).toBe(1)
      expect(result.current[0].target_sets).toBe(3)
      expect(result.current[1].sort_order).toBe(2)
      expect(result.current[1].target_sets).toBe(4)
    })
  })

  it("returns empty array for template with no exercises", async () => {
    const { result } = renderHook(() => useTemplateExercises("t-empty"))
    await waitFor(() => expect(result.current).toEqual([]))
  })
})

describe("useCreateTemplate", () => {
  it("creates a template with the given name", async () => {
    const { result } = renderHook(() => useCreateTemplate())

    let templateId: string | undefined
    await act(async () => {
      templateId = await result.current.mutate({ name: "Push Day", description: "Chest and triceps" })
    })

    expect(templateId).toBeDefined()
    const stored = await db.exercise_templates.get(templateId!)
    expect(stored).toBeDefined()
    expect(stored?.name).toBe("Push Day")
    expect(stored?.description).toBe("Chest and triceps")
    expect(stored?.created_at).toBeDefined()
  })

  it("creates a template without description", async () => {
    const { result } = renderHook(() => useCreateTemplate())

    let templateId: string | undefined
    await act(async () => {
      templateId = await result.current.mutate({ name: "Leg Day" })
    })

    const stored = await db.exercise_templates.get(templateId!)
    expect(stored?.name).toBe("Leg Day")
    expect(stored?.description).toBeNull()
  })
})

describe("useUpdateTemplate", () => {
  it("updates a template's name and description", async () => {
    await db.exercise_templates.add(makeTemplate({ id: "t-upd", name: "Old Name", description: "Old desc" }))

    const { result } = renderHook(() => useUpdateTemplate())

    await act(async () => {
      await result.current.mutate({ id: "t-upd", name: "New Name", description: "New desc" })
    })

    const stored = await db.exercise_templates.get("t-upd")
    expect(stored?.name).toBe("New Name")
    expect(stored?.description).toBe("New desc")
  })
})

describe("useDeleteTemplate", () => {
  it("deletes a template and its exercises", async () => {
    await db.exercise_templates.add(makeTemplate({ id: "t-del" }))
    await db.template_exercises.bulkAdd([
      makeTemplateExercise({ id: "te-1", template_id: "t-del" }),
      makeTemplateExercise({ id: "te-2", template_id: "t-del" }),
    ])

    const { result } = renderHook(() => useDeleteTemplate())

    await act(async () => {
      await result.current.mutate("t-del")
    })

    const storedTemplate = await db.exercise_templates.get("t-del")
    expect(storedTemplate).toBeUndefined()

    const storedExercises = await db.template_exercises.where("template_id").equals("t-del").toArray()
    expect(storedExercises).toHaveLength(0)
  })
})

describe("useAddTemplateExercise", () => {
  it("adds an exercise to a template with auto sort_order", async () => {
    await db.template_exercises.add(makeTemplateExercise({ id: "te-1", template_id: "t-1", exercise_id: "ex-1", sort_order: 1 }))

    const { result } = renderHook(() => useAddTemplateExercise())

    let teId: string | undefined
    await act(async () => {
      teId = await result.current.mutate({ templateId: "t-1", exerciseId: "ex-2" })
    })

    const stored = await db.template_exercises.get(teId!)
    expect(stored).toBeDefined()
    expect(stored?.template_id).toBe("t-1")
    expect(stored?.exercise_id).toBe("ex-2")
    expect(stored?.sort_order).toBe(2)
    expect(stored?.target_sets).toBe(3)
    expect(stored?.rest_secs).toBe(90)
  })

  it("creates sort_order 1 when no exercises exist", async () => {
    const { result } = renderHook(() => useAddTemplateExercise())

    await act(async () => {
      await result.current.mutate({ templateId: "t-new", exerciseId: "ex-1" })
    })

    const all = await db.template_exercises.where("template_id").equals("t-new").toArray()
    expect(all).toHaveLength(1)
    expect(all[0].sort_order).toBe(1)
  })
})

describe("useRemoveTemplateExercise", () => {
  it("removes an exercise from a template", async () => {
    await db.template_exercises.add(makeTemplateExercise({ id: "te-rm", template_id: "t-1" }))

    const { result } = renderHook(() => useRemoveTemplateExercise())

    await act(async () => {
      await result.current.mutate("te-rm")
    })

    const stored = await db.template_exercises.get("te-rm")
    expect(stored).toBeUndefined()
  })
})

describe("useUpdateTemplateExercise", () => {
  it("updates target fields for a template exercise", async () => {
    await db.template_exercises.add(makeTemplateExercise({ id: "te-upd", target_sets: 3, target_reps_min: 8, target_reps_max: 12, target_weight_kg: null, rest_secs: 90 }))

    const { result } = renderHook(() => useUpdateTemplateExercise())

    await act(async () => {
      await result.current.mutate({ id: "te-upd", target_sets: 4, target_reps_min: 6, target_reps_max: 8, target_weight_kg: 50, rest_secs: 120 })
    })

    const stored = await db.template_exercises.get("te-upd")
    expect(stored?.target_sets).toBe(4)
    expect(stored?.target_reps_min).toBe(6)
    expect(stored?.target_reps_max).toBe(8)
    expect(stored?.target_weight_kg).toBe(50)
    expect(stored?.rest_secs).toBe(120)
  })
})

describe("useStartWorkoutFromTemplate", () => {
  it("creates a session, exercises, and sets from a template", async () => {
    await db.exercise_templates.add(makeTemplate({ id: "t-1", name: "Push Day" }))
    await db.template_exercises.bulkAdd([
      makeTemplateExercise({ id: "te-1", template_id: "t-1", exercise_id: "ex-1", sort_order: 1, target_sets: 3, target_reps_min: 8, target_reps_max: 12, target_weight_kg: 50, rest_secs: 90 }),
      makeTemplateExercise({ id: "te-2", template_id: "t-1", exercise_id: "ex-2", sort_order: 2, target_sets: 4, target_reps_min: 10, target_reps_max: 15, target_weight_kg: null, rest_secs: 60 }),
    ])

    const { result } = renderHook(() => useStartWorkoutFromTemplate())

    let sessionId: string | undefined
    await act(async () => {
      sessionId = await result.current.mutate("t-1")
    })

    expect(sessionId).toBeDefined()

    const session = await db.workout_sessions.get(sessionId!)
    expect(session).toBeDefined()
    expect(session?.completed_at).toBeNull()

    const exercises = await db.workout_exercises.where("session_id").equals(sessionId!).sortBy("sort_order")
    expect(exercises).toHaveLength(2)
    expect(exercises[0].exercise_id).toBe("ex-1")
    expect(exercises[1].exercise_id).toBe("ex-2")

    let setsForEx1 = await db.workout_sets.where("workout_exercise_id").equals(exercises[0].id).toArray()
    setsForEx1.sort((a, b) => a.set_number - b.set_number)
    expect(setsForEx1).toHaveLength(3)
    expect(setsForEx1.map((s) => s.set_number)).toEqual([1, 2, 3])
    expect(setsForEx1.every((s) => s.is_completed === false)).toBe(true)
    expect(setsForEx1.every((s) => s.set_type === "normal")).toBe(true)

    let setsForEx2 = await db.workout_sets.where("workout_exercise_id").equals(exercises[1].id).toArray()
    setsForEx2.sort((a, b) => a.set_number - b.set_number)
    expect(setsForEx2).toHaveLength(4)
  })

  it("throws if template does not exist", async () => {
    const { result } = renderHook(() => useStartWorkoutFromTemplate())

    await act(async () => {
      await expect(result.current.mutate("nonexistent")).rejects.toThrow("Template not found")
    })
  })
})
