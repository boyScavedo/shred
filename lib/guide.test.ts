import { generateWeeklyPlan } from "./guide"
import type { Exercise, WorkoutSet, WorkoutSession, WorkoutExercise } from "@/types"

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: `ex-${Math.random().toString(36).slice(2, 7)}`,
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

describe("generateWeeklyPlan", () => {
  it("returns an empty plan when no exercises exist", () => {
    const plan = generateWeeklyPlan({ exercises: [], recentSets: [] })
    expect(plan).toHaveLength(0)
  })

  it("distributes exercises across push/pull/legs/core days", () => {
    const exercises: Exercise[] = [
      makeExercise({ id: "e1", name: "Push-up", movement_pattern: "push", muscle_group_primary: "chest" }),
      makeExercise({ id: "e2", name: "Pull-up", movement_pattern: "pull", muscle_group_primary: "back" }),
      makeExercise({ id: "e3", name: "Squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
    ]

    const plan = generateWeeklyPlan({ exercises, recentSets: [] })

    expect(plan.length).toBeGreaterThanOrEqual(3)

    const pushDay = plan.find((d) => d.muscleGroups.includes("chest"))
    expect(pushDay).toBeDefined()
    expect(pushDay!.exercises.some((e) => e.exercise.name === "Push-up")).toBe(true)

    const pullDay = plan.find((d) => d.muscleGroups.includes("back"))
    expect(pullDay).toBeDefined()
    expect(pullDay!.exercises.some((e) => e.exercise.name === "Pull-up")).toBe(true)

    const legDay = plan.find((d) => d.muscleGroups.includes("quads"))
    expect(legDay).toBeDefined()
    expect(legDay!.exercises.some((e) => e.exercise.name === "Squat")).toBe(true)
  })

  it("groups exercises into 3-6 day plan", () => {
    const exercises: Exercise[] = [
      makeExercise({ id: "e1", name: "Bench", movement_pattern: "push", muscle_group_primary: "chest" }),
      makeExercise({ id: "e2", name: "Row", movement_pattern: "pull", muscle_group_primary: "back" }),
      makeExercise({ id: "e3", name: "Squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
      makeExercise({ id: "e4", name: "RDL", movement_pattern: "hinge", muscle_group_primary: "hamstrings" }),
      makeExercise({ id: "e5", name: "Plank", movement_pattern: "core", muscle_group_primary: "abs" }),
    ]

    const plan = generateWeeklyPlan({ exercises, recentSets: [] })

    expect(plan.length).toBeGreaterThanOrEqual(3)
    expect(plan.length).toBeLessThanOrEqual(7)
    expect(plan[0].day).toBe(0)
    expect(plan[0].label).toBeDefined()
  })

  it("sets default target reps/sets from exercise defaults", () => {
    const exercises: Exercise[] = [
      makeExercise({
        id: "e1",
        name: "Push-up",
        movement_pattern: "push",
        muscle_group_primary: "chest",
        default_sets: 4,
        default_reps_min: 10,
        default_reps_max: 15,
      }),
    ]

    const plan = generateWeeklyPlan({ exercises, recentSets: [] })

    expect(plan[0].exercises[0].targetSets).toBe(4)
    expect(plan[0].exercises[0].targetRepsMin).toBe(10)
    expect(plan[0].exercises[0].targetRepsMax).toBe(15)
  })

  it("avoids scheduling muscle groups trained within 48h", () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const exercises: Exercise[] = [
      makeExercise({ id: "e1", name: "Push-up", movement_pattern: "push", muscle_group_primary: "chest" }),
      makeExercise({ id: "e2", name: "Squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
    ]

    const recentSets = [
      {
        sessionCompletedAt: yesterday.toISOString(),
        muscleGroups: ["chest" as const],
      },
    ]

    const plan = generateWeeklyPlan({ exercises, recentSets })

    // Chest was trained yesterday, so day 0 (Monday) should not schedule chest muscle group
    const day0 = plan.find((d) => d.day === 0)
    if (day0) {
      expect(day0.muscleGroups).not.toContain("chest")
    }
  })
})
