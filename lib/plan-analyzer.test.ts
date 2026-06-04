import { analyzePlan } from "./plan-analyzer"
import type { Exercise, TemplateExercise, UserProfile } from "@/types"

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex-1",
    name: "Test",
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
    equipment_required: ["barbell"],
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeTE(overrides: Partial<TemplateExercise> = {}): TemplateExercise {
  return {
    id: "te-1",
    template_id: "tmpl-1",
    exercise_id: "ex-1",
    sort_order: 1,
    target_sets: 4,
    target_reps_min: 8,
    target_reps_max: 12,
    target_weight_kg: null,
    rest_secs: 90,
    rest_after_exercise_secs: 180,
    ...overrides,
  }
}

const baseProfile: Pick<UserProfile, "goal" | "body_goal" | "experience" | "days_per_week"> = {
  goal: "hypertrophy",
  body_goal: "maintaining",
  experience: "intermediate",
  days_per_week: 4,
}

describe("analyzePlan", () => {
  it("returns F grade for empty template", () => {
    const result = analyzePlan({ templateExercises: [], exercises: [], profile: baseProfile })
    expect(result.grade).toBe("F")
    expect(result.score).toBe(0)
    expect(result.issues[0].code).toBe("EMPTY")
  })

  it("flags no pulling exercises", () => {
    const ex = makeExercise({ id: "ex-1", movement_pattern: "push" })
    const te = makeTE({ exercise_id: "ex-1" })
    const result = analyzePlan({ templateExercises: [te], exercises: [ex], profile: baseProfile })
    expect(result.issues.some((i) => i.code === "NO_PULL")).toBe(true)
  })

  it("does not flag push/pull when balanced", () => {
    const push = makeExercise({ id: "push", movement_pattern: "push", muscle_group_primary: "chest" })
    const pull = makeExercise({ id: "pull", movement_pattern: "pull", muscle_group_primary: "back" })
    const te1 = makeTE({ id: "te-1", exercise_id: "push" })
    const te2 = makeTE({ id: "te-2", exercise_id: "pull" })
    const result = analyzePlan({ templateExercises: [te1, te2], exercises: [push, pull], profile: baseProfile })
    expect(result.issues.some((i) => i.code === "NO_PULL")).toBe(false)
    expect(result.issues.some((i) => i.code === "PUSH_HEAVY")).toBe(false)
  })

  it("flags rep range mismatch for strength goal with high reps", () => {
    const ex = makeExercise({ id: "ex-1", movement_pattern: "push", default_reps_min: 15, default_reps_max: 20 })
    const te = makeTE({ exercise_id: "ex-1", target_reps_min: 15, target_reps_max: 20 })
    const profile = { ...baseProfile, goal: "strength" as const }
    const result = analyzePlan({ templateExercises: [te], exercises: [ex], profile })
    expect(result.issues.some((i) => i.code === "REP_RANGE_MISMATCH")).toBe(true)
  })

  it("gives high rep alignment score when reps match goal", () => {
    const ex = makeExercise({ id: "ex-1", movement_pattern: "push" })
    const te = makeTE({ exercise_id: "ex-1", target_reps_min: 8, target_reps_max: 12 })
    const result = analyzePlan({ templateExercises: [te], exercises: [ex], profile: baseProfile })
    expect(result.goal_alignment).toBeGreaterThan(50)
  })

  it("flags chest without back", () => {
    const chest = makeExercise({ id: "ex-1", movement_pattern: "push", muscle_group_primary: "chest" })
    const te = makeTE({ exercise_id: "ex-1", target_sets: 5 })
    const result = analyzePlan({ templateExercises: [te], exercises: [chest], profile: baseProfile })
    expect(result.issues.some((i) => i.code === "NO_BACK")).toBe(true)
  })

  it("flags bulking plan without squat/hinge", () => {
    const ex = makeExercise({ id: "ex-1", movement_pattern: "push" })
    const te = makeTE({ exercise_id: "ex-1" })
    const profile = { ...baseProfile, body_goal: "bulking" as const }
    const result = analyzePlan({ templateExercises: [te], exercises: [ex], profile })
    expect(result.issues.some((i) => i.code === "BULK_NO_LEGS")).toBe(true)
    expect(result.suggestions.some((s) => s.includes("Bulking"))).toBe(true)
  })

  it("includes cutting tips for cutting body goal", () => {
    const ex = makeExercise({ id: "ex-1", movement_pattern: "push" })
    const te = makeTE({ exercise_id: "ex-1" })
    const profile = { ...baseProfile, body_goal: "cutting" as const }
    const result = analyzePlan({ templateExercises: [te], exercises: [ex], profile })
    expect(result.suggestions.some((s) => s.includes("Cutting"))).toBe(true)
  })

  it("volume_by_muscle includes secondary muscles at half credit", () => {
    const ex = makeExercise({ id: "ex-1", muscle_group_primary: "chest", muscle_group_secondary: "triceps" })
    const te = makeTE({ exercise_id: "ex-1", target_sets: 4 })
    const result = analyzePlan({ templateExercises: [te], exercises: [ex], profile: baseProfile })
    // 4 sets × 4 days = 16 for chest, 8 for triceps
    expect(result.volume_by_muscle["chest"]).toBe(16)
    expect(result.volume_by_muscle["triceps"]).toBe(8)
  })

  it("score is 0–100", () => {
    const ex = makeExercise()
    const te = makeTE()
    const result = analyzePlan({ templateExercises: [te], exercises: [ex], profile: baseProfile })
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it("compound ratio calculated correctly", () => {
    const compound = makeExercise({ id: "c", mechanics: "compound" })
    const isolation = makeExercise({ id: "i", mechanics: "isolation", movement_pattern: "pull", muscle_group_primary: "back" })
    const te1 = makeTE({ id: "te-1", exercise_id: "c" })
    const te2 = makeTE({ id: "te-2", exercise_id: "i" })
    const result = analyzePlan({ templateExercises: [te1, te2], exercises: [compound, isolation], profile: baseProfile })
    expect(result.compound_ratio).toBe(0.5)
  })
})
