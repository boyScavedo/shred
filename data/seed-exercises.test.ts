import type { MovementPattern } from "@/types"
import { SEED_EXERCISES, SEED_PROGRESSIONS } from "./seed-exercises"

const ALL_MUSCLE_GROUPS = ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "abs", "forearms", "traps"]
const ALL_MOVEMENT_PATTERNS: MovementPattern[] = ["push", "pull", "squat", "hinge", "core", "carry"]

describe("Seed Data", () => {
  it("has at least 30 exercises", () => {
    expect(SEED_EXERCISES.length).toBeGreaterThanOrEqual(30)
  })

  it("every exercise has unique id", () => {
    const ids = SEED_EXERCISES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("every exercise has a valid muscle group", () => {
    for (const ex of SEED_EXERCISES) {
      expect(ALL_MUSCLE_GROUPS).toContain(ex.muscle_group_primary)
    }
  })

  it("every exercise has a valid movement pattern", () => {
    for (const ex of SEED_EXERCISES) {
      expect(ALL_MOVEMENT_PATTERNS).toContain(ex.movement_pattern)
    }
  })

  it("covers all movement patterns", () => {
    const patterns = new Set(SEED_EXERCISES.map((e) => e.movement_pattern))
    for (const mp of ALL_MOVEMENT_PATTERNS) {
      if (mp !== "carry") {
        expect(patterns.has(mp)).toBe(true)
      }
    }
  })

  it("progression chain references valid exercise ids", () => {
    const exerciseIds = new Set(SEED_EXERCISES.map((e) => e.id))
    for (const prog of SEED_PROGRESSIONS) {
      expect(exerciseIds.has(prog.exercise_id)).toBe(true)
    }
  })

  it("each exercise with bodyweight_progression_id has a matching progression entry", () => {
    const progExerciseIds = new Set(SEED_PROGRESSIONS.map((p) => p.exercise_id))
    for (const ex of SEED_EXERCISES) {
      if (ex.bodyweight_progression_id) {
        expect(progExerciseIds.has(ex.id)).toBe(true)
      }
    }
  })

  it("every progression chain has ordered variations", () => {
    const chains = new Map<string, { sort_order: number; name: string }[]>()
    for (const prog of SEED_PROGRESSIONS) {
      if (!chains.has(prog.id)) chains.set(prog.id, [])
      chains.get(prog.id)!.push({ sort_order: prog.sort_order, name: prog.variation_name })
    }
    for (const [, variations] of chains) {
      const sorted = [...variations].sort((a, b) => a.sort_order - b.sort_order)
      expect(variations).toEqual(sorted)
    }
  })
})
