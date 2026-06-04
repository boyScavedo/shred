import { generateRecommendation } from "./recommendations"
import type { Exercise } from "@/types"
import type { GenerateInput as GenInput } from "./recommendations"

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex-1",
    name: "Push-up",
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

const base: GenInput = {
  goal: "hypertrophy",
  body_goal: "maintaining",
  experience: "intermediate",
  days_per_week: 4,
  equipment: ["bodyweight"],
  exercises: [
    makeExercise({ id: "push", movement_pattern: "push" }),
    makeExercise({ id: "pull", movement_pattern: "pull", muscle_group_primary: "back" }),
    makeExercise({ id: "squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
    makeExercise({ id: "hinge", movement_pattern: "hinge", muscle_group_primary: "hamstrings" }),
  ],
}

describe("generateRecommendation", () => {
  it("returns upper/lower split for 4 days intermediate", () => {
    const result = generateRecommendation(base)
    expect(result.split.split).toBe("upper_lower")
    expect(result.split.days_per_week).toBe(4)
  })

  it("returns full body for 3 days", () => {
    const result = generateRecommendation({ ...base, days_per_week: 3 })
    expect(result.split.split).toBe("full_body")
  })

  it("returns full body for beginner regardless of days", () => {
    const result = generateRecommendation({ ...base, days_per_week: 5, experience: "beginner" })
    expect(result.split.split).toBe("full_body")
  })

  it("returns ppl for 5 days intermediate", () => {
    const result = generateRecommendation({ ...base, days_per_week: 5 })
    expect(result.split.split).toBe("ppl")
  })

  it("returns ppl_x2 for 6 days", () => {
    const result = generateRecommendation({ ...base, days_per_week: 6 })
    expect(result.split.split).toBe("ppl_x2")
  })

  it("includes recommended exercises", () => {
    const result = generateRecommendation(base)
    expect(result.recommended_exercises.length).toBeGreaterThan(0)
    expect(result.recommended_exercises[0].exercise).toBeDefined()
    expect(result.recommended_exercises[0].priority).toBeDefined()
  })

  it("excludes exercises requiring unavailable equipment", () => {
    const barbellEx = makeExercise({
      id: "barbell-ex",
      resistance_type: "barbell",
      equipment_required: ["barbell"],
    })
    const result = generateRecommendation({
      ...base,
      equipment: ["bodyweight"],
      exercises: [...base.exercises, barbellEx],
    })
    expect(result.recommended_exercises.some((r) => r.exercise.id === "barbell-ex")).toBe(false)
  })

  it("includes strength-specific tips for strength goal", () => {
    const result = generateRecommendation({ ...base, goal: "strength" })
    expect(result.tips.some((t) => t.toLowerCase().includes("strength") || t.toLowerCase().includes("deload"))).toBe(true)
  })

  it("includes cutting tips for cutting body goal", () => {
    const result = generateRecommendation({ ...base, body_goal: "cutting" })
    expect(result.split.cut_adjustments.length).toBeGreaterThan(0)
    expect(result.tips.some((t) => t.toLowerCase().includes("cardio") || t.toLowerCase().includes("deficit"))).toBe(true)
  })

  it("includes weekly checklist", () => {
    const result = generateRecommendation(base)
    expect(result.weekly_checklist.length).toBeGreaterThan(0)
  })

  it("strength goal gives lower rep range", () => {
    const result = generateRecommendation({ ...base, goal: "strength" })
    expect(result.split.rep_range.max).toBeLessThanOrEqual(6)
  })

  it("endurance goal gives higher rep range", () => {
    const result = generateRecommendation({ ...base, goal: "endurance" })
    expect(result.split.rep_range.min).toBeGreaterThanOrEqual(12)
  })
})
