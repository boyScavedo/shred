import type { Exercise, BodyweightProgression, WorkoutSet, ProgressiveOverloadDecision } from "@/types"

export interface ProgressionInput {
  exercise: Exercise
  completedSets: Pick<WorkoutSet, "reps" | "duration_secs" | "weight_kg" | "set_number" | "is_completed">[]
  bodyweightChain?: BodyweightProgression[]
}

function getWeightIncrement(resistanceType: string): number {
  if (resistanceType === "weighted_bodyweight") return 1
  return 2.5
}

export function evaluateProgression(input: ProgressionInput): ProgressiveOverloadDecision {
  const { exercise, bodyweightChain } = input
  const completed = input.completedSets.filter((s) => s.is_completed)

  if (completed.length === 0) {
    return { action: "maintain", reason: "No completed sets found" }
  }

  const isDuration = exercise.load_type === "duration"

  if (isDuration) {
    const targetSecs = exercise.default_duration_secs ?? 30
    const allExceed = completed.every((s) => (s.duration_secs ?? 0) >= targetSecs)

    if (allExceed) {
      return {
        action: "increase_weight",
        reason: `All sets exceeded ${targetSecs}s target. Try a harder variation or add weight.`,
        new_weight_kg: undefined,
      }
    }
    return {
      action: "maintain",
      reason: `Build up to ${targetSecs}s on all sets before progressing.`,
    }
  }

  const minReps = exercise.default_reps_min ?? 6
  const maxReps = exercise.default_reps_max ?? 12
  const useWeight = exercise.resistance_type !== "bodyweight" || exercise.prescription_mode === "weighted_bodyweight_reps"
  const currentWeight = completed.length > 0 ? (completed[0].weight_kg ?? 0) : 0
  const allHitMax = completed.every((s) => (s.reps ?? 0) >= maxReps)
  const anyBelowMin = completed.some((s) => (s.reps ?? 0) < minReps)

  const isBodyweightWithChain = exercise.prescription_mode === "bodyweight_reps"
    && exercise.bodyweight_progression_id != null
    && bodyweightChain != null
    && bodyweightChain.length > 0

  if (allHitMax) {
    if (isBodyweightWithChain) {
      const sorted = [...bodyweightChain!].sort((a, b) => a.sort_order - b.sort_order)
      const currentIndex = sorted.findIndex((p) => p.exercise_id === exercise.id)
      const next = currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null

      if (next) {
        return {
          action: "advance_variation",
          reason: `All sets hit ${maxReps} reps. Advance to ${next.variation_name}.`,
        }
      }
      return {
        action: "maintain",
        reason: `You've mastered this progression! No harder variation available.`,
      }
    }

    if (useWeight) {
      return {
        action: "increase_weight",
        reason: `All sets hit ${maxReps} reps. Increase weight by ${getWeightIncrement(exercise.resistance_type)}kg.`,
        new_weight_kg: Math.round((currentWeight + getWeightIncrement(exercise.resistance_type)) * 10) / 10,
        new_reps_min: minReps,
        new_reps_max: maxReps,
      }
    }

    return { action: "maintain", reason: `All sets hit ${maxReps} reps.` }
  }

  if (anyBelowMin) {
    return {
      action: "maintain",
      reason: `Some sets below ${minReps} reps. Focus on hitting the rep range.`,
    }
  }

  return {
    action: "maintain",
    reason: `Reps within ${minReps}-${maxReps} range. Try to hit ${maxReps} on all sets.`,
  }
}
