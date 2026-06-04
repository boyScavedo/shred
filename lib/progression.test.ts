import "fake-indexeddb/auto"
import { evaluateProgression } from "./progression"
import type { Exercise, BodyweightProgression, WorkoutSet } from "@/types"

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

function makeSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: `set-${Math.random().toString(36).slice(2, 7)}`,
    workout_exercise_id: "we-1",
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

describe("evaluateProgression", () => {
  describe("no historical data", () => {
    it("returns maintain when no sets provided", () => {
      const result = evaluateProgression({
        exercise: makeExercise(),
        completedSets: [],
      })
      expect(result.action).toBe("maintain")
      expect(result.reason).toMatch(/no completed/i)
    })
  })

  describe("weighted exercises (double progression)", () => {
    it("recommends increase when all sets hit max reps", () => {
      const exercise = makeExercise({
        resistance_type: "barbell",
        prescription_mode: "weight_reps",
        default_reps_min: 8,
        default_reps_max: 12,
      })
      const sets = [
        makeSet({ reps: 12, weight_kg: 50, set_number: 1 }),
        makeSet({ reps: 12, weight_kg: 50, set_number: 2 }),
        makeSet({ reps: 12, weight_kg: 50, set_number: 3 }),
      ]

      const result = evaluateProgression({ exercise, completedSets: sets })
      expect(result.action).toBe("increase_weight")
      expect(result.new_weight_kg).toBe(52.5)
      expect(result.new_reps_min).toBe(8)
      expect(result.new_reps_max).toBe(12)
    })

    it("returns maintain when all sets are within range but not all at max", () => {
      const exercise = makeExercise({
        resistance_type: "barbell",
        prescription_mode: "weight_reps",
        default_reps_min: 8,
        default_reps_max: 12,
      })
      const sets = [
        makeSet({ reps: 10, weight_kg: 50, set_number: 1 }),
        makeSet({ reps: 11, weight_kg: 50, set_number: 2 }),
        makeSet({ reps: 12, weight_kg: 50, set_number: 3 }),
      ]

      const result = evaluateProgression({ exercise, completedSets: sets })
      expect(result.action).toBe("maintain")
    })

    it("returns maintain when any set is below min reps", () => {
      const exercise = makeExercise({
        resistance_type: "barbell",
        prescription_mode: "weight_reps",
        default_reps_min: 8,
        default_reps_max: 12,
      })
      const sets = [
        makeSet({ reps: 6, weight_kg: 50, set_number: 1 }),
        makeSet({ reps: 8, weight_kg: 50, set_number: 2 }),
        makeSet({ reps: 9, weight_kg: 50, set_number: 3 }),
      ]

      const result = evaluateProgression({ exercise, completedSets: sets })
      expect(result.action).toBe("maintain")
    })

    it("only considers completed sets", () => {
      const exercise = makeExercise({
        resistance_type: "barbell",
        prescription_mode: "weight_reps",
        default_reps_min: 8,
        default_reps_max: 12,
      })
      const sets = [
        makeSet({ reps: 12, weight_kg: 50, set_number: 1, is_completed: true }),
        makeSet({ reps: 12, weight_kg: 50, set_number: 2, is_completed: true }),
        makeSet({ reps: 5, weight_kg: 50, set_number: 3, is_completed: false }),
      ]

      const result = evaluateProgression({ exercise, completedSets: sets })
      expect(result.action).toBe("increase_weight")
    })

    it("increments weight by 2.5kg for barbell exercises", () => {
      const exercise = makeExercise({
        resistance_type: "barbell",
        prescription_mode: "weight_reps",
        default_reps_min: 8,
        default_reps_max: 12,
      })
      const sets = [makeSet({ reps: 12, weight_kg: 50, set_number: 1 })]

      const result = evaluateProgression({ exercise, completedSets: sets })
      expect(result.new_weight_kg).toBe(52.5)
    })

    it("increments weight by 2.5kg for dumbbell exercises", () => {
      const exercise = makeExercise({
        resistance_type: "dumbbell",
        prescription_mode: "weight_reps",
        default_reps_min: 8,
        default_reps_max: 12,
      })
      const sets = [makeSet({ reps: 12, weight_kg: 20, set_number: 1 })]

      const result = evaluateProgression({ exercise, completedSets: sets })
      expect(result.new_weight_kg).toBe(22.5)
    })

    it("increments weight by 1kg for bodyweight weighted exercises", () => {
      const exercise = makeExercise({
        resistance_type: "weighted_bodyweight",
        prescription_mode: "weighted_bodyweight_reps",
        default_reps_min: 8,
        default_reps_max: 12,
      })
      const sets = [makeSet({ reps: 12, weight_kg: 10, set_number: 1 })]

      const result = evaluateProgression({ exercise, completedSets: sets })
      expect(result.new_weight_kg).toBe(11)
    })
  })

  describe("bodyweight exercises with progression chain", () => {
    const progChain: BodyweightProgression[] = [
      { id: "p1", exercise_id: "incline-push-up", variation_name: "Incline Push-up", sort_order: 1 },
      { id: "p2", exercise_id: "push-up", variation_name: "Standard Push-up", sort_order: 2 },
      { id: "p3", exercise_id: "diamond-push-up", variation_name: "Diamond Push-up", sort_order: 3 },
    ]

    it("recommends advance when all sets hit max reps", () => {
      const exercise = makeExercise({
        id: "incline-push-up",
        resistance_type: "bodyweight",
        prescription_mode: "bodyweight_reps",
        default_reps_min: 10,
        default_reps_max: 15,
        bodyweight_progression_id: "prog-push",
      })
      const sets = [
        makeSet({ reps: 15, set_number: 1 }),
        makeSet({ reps: 15, set_number: 2 }),
        makeSet({ reps: 15, set_number: 3 }),
      ]

      const result = evaluateProgression({
        exercise,
        completedSets: sets,
        bodyweightChain: progChain,
      })
      expect(result.action).toBe("advance_variation")
      expect(result.reason).toContain("Standard Push-up")
    })

    it("returns maintain when not all sets hit max reps", () => {
      const exercise = makeExercise({
        id: "incline-push-up",
        resistance_type: "bodyweight",
        prescription_mode: "bodyweight_reps",
        default_reps_min: 10,
        default_reps_max: 15,
        bodyweight_progression_id: "prog-push",
      })
      const sets = [
        makeSet({ reps: 12, set_number: 1 }),
        makeSet({ reps: 15, set_number: 2 }),
        makeSet({ reps: 15, set_number: 3 }),
      ]

      const result = evaluateProgression({
        exercise,
        completedSets: sets,
        bodyweightChain: progChain,
      })
      expect(result.action).toBe("maintain")
    })

    it("returns maintain when at the last progression", () => {
      const exercise = makeExercise({
        id: "pike-push-up",
        resistance_type: "bodyweight",
        prescription_mode: "bodyweight_reps",
        default_reps_min: 6,
        default_reps_max: 10,
        bodyweight_progression_id: "prog-push",
      })
      const shortChain: BodyweightProgression[] = [
        { id: "p1", exercise_id: "incline-push-up", variation_name: "Incline Push-up", sort_order: 1 },
        { id: "p2", exercise_id: "pike-push-up", variation_name: "Pike Push-up", sort_order: 2 },
      ]
      const sets = [
        makeSet({ reps: 10, set_number: 1 }),
        makeSet({ reps: 10, set_number: 2 }),
        makeSet({ reps: 10, set_number: 3 }),
      ]

      const result = evaluateProgression({
        exercise,
        completedSets: sets,
        bodyweightChain: shortChain,
      })
      expect(result.action).toBe("maintain")
      expect(result.reason).toMatch(/master/i)
    })

    it("returns maintain when no progression chain provided", () => {
      const exercise = makeExercise({
        id: "incline-push-up",
        resistance_type: "bodyweight",
        prescription_mode: "bodyweight_reps",
        default_reps_min: 10,
        default_reps_max: 15,
        bodyweight_progression_id: "prog-push",
      })
      const sets = [makeSet({ reps: 15, set_number: 1 })]

      const result = evaluateProgression({
        exercise,
        completedSets: sets,
      })
      expect(result.action).toBe("maintain")
    })
  })

  describe("duration exercises", () => {
    it("recommends increase when all sets exceed target duration", () => {
      const exercise = makeExercise({
        resistance_type: "bodyweight",
        prescription_mode: "duration",
        load_type: "duration",
        default_sets: 3,
        default_reps_min: null,
        default_reps_max: null,
        default_duration_secs: 30,
      })
      const sets = [
        makeSet({ duration_secs: 35, set_number: 1 }),
        makeSet({ duration_secs: 35, set_number: 2 }),
        makeSet({ duration_secs: 35, set_number: 3 }),
      ]

      const result = evaluateProgression({ exercise, completedSets: sets })
      expect(result.action).toBe("increase_weight")
    })
  })
})
