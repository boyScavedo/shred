import type {
  Exercise,
  TemplateExercise,
  MuscleGroup,
  MovementPattern,
  FitnessGoal,
  BodyGoal,
  UserProfile,
} from "@/types"

export type IssueSeverity = "error" | "warning" | "tip"

export interface PlanIssue {
  severity: IssueSeverity
  code: string
  message: string
  suggestion: string
}

export interface PlanAnalysis {
  score: number
  grade: "A" | "B" | "C" | "D" | "F"
  goal_alignment: number
  issues: PlanIssue[]
  suggestions: string[]
  volume_by_muscle: Partial<Record<MuscleGroup, number>>
  push_pull_ratio: number
  compound_ratio: number
  avg_rep_range_min: number
  avg_rep_range_max: number
}

// Recommended weekly sets per muscle group by goal
const VOLUME_TARGETS: Record<FitnessGoal, { min: number; max: number }> = {
  strength:    { min: 10, max: 15 },
  hypertrophy: { min: 15, max: 20 },
  endurance:   { min: 20, max: 25 },
  general:     { min: 10, max: 18 },
}

// Ideal rep ranges by goal
const REP_TARGETS: Record<FitnessGoal, { min: number; max: number }> = {
  strength:    { min: 1,  max: 6  },
  hypertrophy: { min: 6,  max: 12 },
  endurance:   { min: 12, max: 20 },
  general:     { min: 6,  max: 15 },
}

// Minimum compound % by goal
const COMPOUND_TARGETS: Record<FitnessGoal, number> = {
  strength:    0.80,
  hypertrophy: 0.60,
  endurance:   0.50,
  general:     0.60,
}

function gradeScore(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 85) return "A"
  if (score >= 70) return "B"
  if (score >= 55) return "C"
  if (score >= 40) return "D"
  return "F"
}

// How many days per week a template is used (inferred from exercise variety)
// Since templates don't have session count, we assume template = 1 training day
// and multiply by days_per_week for weekly volume
function weeklyVolume(sets: number, daysPerWeek: number): number {
  return sets * daysPerWeek
}

export interface AnalyzeInput {
  templateExercises: TemplateExercise[]
  exercises: Exercise[]
  profile: Pick<UserProfile, "goal" | "body_goal" | "experience" | "days_per_week">
}

export function analyzePlan(input: AnalyzeInput): PlanAnalysis {
  const { templateExercises, exercises, profile } = input
  const { goal, body_goal, days_per_week } = profile
  const issues: PlanIssue[] = []
  const suggestions: string[] = []

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]))

  const enriched = templateExercises
    .map((te) => ({ te, ex: exerciseMap.get(te.exercise_id) }))
    .filter((x): x is { te: TemplateExercise; ex: Exercise } => x.ex !== undefined)

  if (enriched.length === 0) {
    return {
      score: 0,
      grade: "F",
      goal_alignment: 0,
      issues: [{ severity: "error", code: "EMPTY", message: "Template has no exercises", suggestion: "Add exercises to analyze this plan." }],
      suggestions: ["Add exercises to get started."],
      volume_by_muscle: {},
      push_pull_ratio: 0,
      compound_ratio: 0,
      avg_rep_range_min: 0,
      avg_rep_range_max: 0,
    }
  }

  // --- Volume per muscle group (weekly) ---
  const volumeByMuscle: Partial<Record<MuscleGroup, number>> = {}
  for (const { te, ex } of enriched) {
    const sets = te.target_sets * days_per_week
    const primary = ex.muscle_group_primary
    volumeByMuscle[primary] = (volumeByMuscle[primary] ?? 0) + sets
    if (ex.muscle_group_secondary) {
      const sec = ex.muscle_group_secondary
      // secondary gets half credit
      volumeByMuscle[sec] = (volumeByMuscle[sec] ?? 0) + Math.floor(sets / 2)
    }
  }

  // --- Volume adequacy check ---
  const target = VOLUME_TARGETS[goal]
  let cutBulkMultiplier = 1
  if (body_goal === "cutting") cutBulkMultiplier = 0.80
  if (body_goal === "bulking") cutBulkMultiplier = 1.10

  const adjustedMin = Math.round(target.min * cutBulkMultiplier)
  const adjustedMax = Math.round(target.max * cutBulkMultiplier)

  const trainedGroups = Object.keys(volumeByMuscle) as MuscleGroup[]
  let volumeScore = 0
  let volumeChecked = 0

  for (const group of trainedGroups) {
    const vol = volumeByMuscle[group] ?? 0
    volumeChecked++
    if (vol < adjustedMin) {
      issues.push({
        severity: vol < adjustedMin * 0.6 ? "error" : "warning",
        code: "LOW_VOLUME",
        message: `${group}: ${vol} sets/week (target ${adjustedMin}–${adjustedMax})`,
        suggestion: `Add ${adjustedMin - vol} more sets/week for ${group} to hit minimum effective volume.`,
      })
      volumeScore += (vol / adjustedMin) * 100
    } else if (vol > adjustedMax * 1.3) {
      issues.push({
        severity: "warning",
        code: "HIGH_VOLUME",
        message: `${group}: ${vol} sets/week exceeds max recoverable volume (${adjustedMax})`,
        suggestion: `Reduce ${group} volume by ${vol - adjustedMax} sets/week to avoid overtraining.`,
      })
      volumeScore += 70
    } else {
      volumeScore += 100
    }
  }

  const avgVolumeScore = volumeChecked > 0 ? volumeScore / volumeChecked : 50

  // --- Push/Pull ratio ---
  const pushCount = enriched.filter((x) => x.ex.movement_pattern === "push").length
  const pullCount = enriched.filter((x) => x.ex.movement_pattern === "pull").length
  const pushPullRatio = pullCount === 0 ? pushCount : pushCount / pullCount

  if (pullCount === 0 && pushCount > 0) {
    issues.push({
      severity: "error",
      code: "NO_PULL",
      message: "No pulling exercises in this plan",
      suggestion: "Add rows, pull-ups, or deadlifts to balance push movements and protect shoulders.",
    })
  } else if (pushPullRatio > 1.5) {
    issues.push({
      severity: "warning",
      code: "PUSH_HEAVY",
      message: `Push:Pull ratio is ${pushPullRatio.toFixed(1)}:1 (ideal ≤1.2:1)`,
      suggestion: "Add more pulling exercises (rows, pull-ups) — imbalance causes shoulder impingement over time.",
    })
  } else if (pushPullRatio < 0.5 && pushCount > 0) {
    issues.push({
      severity: "tip",
      code: "PULL_HEAVY",
      message: "More pulling than pushing — good for posture",
      suggestion: "Consider adding a push movement for chest/shoulder development.",
    })
  }

  const pushPullScore = pullCount === 0 && pushCount > 0 ? 0
    : pushPullRatio <= 1.2 ? 100
    : pushPullRatio <= 1.5 ? 70
    : 40

  // --- Compound ratio ---
  const compoundCount = enriched.filter((x) => x.ex.mechanics === "compound").length
  const compoundRatio = compoundCount / enriched.length
  const compoundTarget = COMPOUND_TARGETS[goal]

  if (compoundRatio < compoundTarget - 0.1) {
    issues.push({
      severity: "warning",
      code: "LOW_COMPOUND",
      message: `Only ${Math.round(compoundRatio * 100)}% compound exercises (${goal} goal needs ${Math.round(compoundTarget * 100)}%+)`,
      suggestion: `Replace some isolation exercises with compound movements like squats, deadlifts, rows, or presses.`,
    })
  }

  const compoundScore = compoundRatio >= compoundTarget ? 100
    : compoundRatio >= compoundTarget - 0.15 ? 75
    : 50

  // --- Rep range alignment ---
  const repTarget = REP_TARGETS[goal]
  const repRanges = enriched
    .filter((x) => x.ex.load_type === "reps")
    .map((x) => ({
      min: x.te.target_reps_min ?? x.ex.default_reps_min ?? 8,
      max: x.te.target_reps_max ?? x.ex.default_reps_max ?? 12,
    }))

  const avgMin = repRanges.length > 0
    ? repRanges.reduce((s, r) => s + r.min, 0) / repRanges.length
    : repTarget.min
  const avgMax = repRanges.length > 0
    ? repRanges.reduce((s, r) => s + r.max, 0) / repRanges.length
    : repTarget.max

  const repOverlap =
    Math.min(avgMax, repTarget.max) - Math.max(avgMin, repTarget.min)
  const repRange = repTarget.max - repTarget.min
  const repAlignmentRatio = repRange > 0 ? Math.max(0, repOverlap / repRange) : 0

  if (repAlignmentRatio < 0.4) {
    issues.push({
      severity: "warning",
      code: "REP_RANGE_MISMATCH",
      message: `Avg rep range ${Math.round(avgMin)}–${Math.round(avgMax)} doesn't match ${goal} target (${repTarget.min}–${repTarget.max})`,
      suggestion: `Adjust target reps on template exercises to ${repTarget.min}–${repTarget.max} for ${goal} adaptations.`,
    })
  }

  const repScore = Math.round(repAlignmentRatio * 100)

  // --- Frequency check ---
  const keyGroups: MuscleGroup[] = ["chest", "back", "shoulders", "quads", "hamstrings", "glutes"]
  for (const group of keyGroups) {
    if (volumeByMuscle[group] !== undefined && days_per_week < 2) {
      issues.push({
        severity: "tip",
        code: "LOW_FREQUENCY",
        message: `Training ${group} only once per week`,
        suggestion: `Training each muscle 2×/week produces significantly faster progress.`,
      })
      break
    }
  }

  // --- Cut/Bulk specific ---
  if (body_goal === "cutting") {
    const hasCardioVariety = enriched.some((x) =>
      x.ex.load_type === "duration" || x.ex.movement_pattern === "core"
    )
    if (!hasCardioVariety) {
      issues.push({
        severity: "tip",
        code: "CUTTING_NO_CARDIO",
        message: "No metabolic/conditioning work for cutting phase",
        suggestion: "Add 1–2 duration-based exercises (plank, circuits) or LISS cardio sessions to preserve muscle while cutting.",
      })
    }
    suggestions.push("Cutting: keep compound lifts heavy to preserve muscle. Reduce rest times to 60s for metabolic effect.")
    suggestions.push("Prioritize protein intake (~2.2g/kg bodyweight) to prevent muscle loss in calorie deficit.")
  }

  if (body_goal === "bulking") {
    const hasSquatOrDeadlift = enriched.some((x) =>
      ["squat", "hinge"].includes(x.ex.movement_pattern)
    )
    if (!hasSquatOrDeadlift) {
      issues.push({
        severity: "warning",
        code: "BULK_NO_LEGS",
        message: "No squat or hinge pattern — missing biggest mass builders",
        suggestion: "Add squats or deadlifts. Leg training releases more anabolic hormones systemically.",
      })
    }
    suggestions.push("Bulking: rest 2–5 min between sets for maximum strength and hypertrophy stimulus.")
    suggestions.push("Track progressive overload weekly — aim to add weight or reps every session.")
  }

  // --- Goal-specific tips ---
  if (goal === "strength") {
    suggestions.push("Strength: prioritize compound lifts in 3–6 rep range. Deload every 4–6 weeks.")
  }
  if (goal === "hypertrophy") {
    suggestions.push("Hypertrophy: train each muscle 2×/week with 15–20 sets total. Focus on mind-muscle connection.")
    suggestions.push("Include both compound (mechanical tension) and isolation (metabolic stress) exercises.")
  }
  if (goal === "endurance") {
    suggestions.push("Endurance: shorter rest periods (30–60s), circuit-style training, high rep ranges (15–25).")
  }

  // --- Muscle imbalance check ---
  const hasBack = (volumeByMuscle["back"] ?? 0) > 0
  const hasChest = (volumeByMuscle["chest"] ?? 0) > 0
  if (hasChest && !hasBack) {
    issues.push({
      severity: "error",
      code: "NO_BACK",
      message: "Chest trained but no back exercises",
      suggestion: "Add rows or pull-ups. Chest-without-back causes postural issues and shoulder injury.",
    })
  }

  const hasQuads = (volumeByMuscle["quads"] ?? 0) > 0
  const hasHamstrings = (volumeByMuscle["hamstrings"] ?? 0) > 0 || (volumeByMuscle["glutes"] ?? 0) > 0
  if (hasQuads && !hasHamstrings) {
    issues.push({
      severity: "warning",
      code: "QUAD_DOMINANT",
      message: "Quad exercises without hamstring/glute work",
      suggestion: "Add Romanian deadlifts or leg curls — quad dominance leads to knee problems.",
    })
  }

  // --- Score calculation ---
  const errorCount = issues.filter((i) => i.severity === "error").length
  const warningCount = issues.filter((i) => i.severity === "warning").length

  const rawScore = Math.round(
    avgVolumeScore * 0.30 +
    pushPullScore  * 0.20 +
    compoundScore  * 0.20 +
    repScore       * 0.20 +
    100            * 0.10
  )

  const penalized = Math.max(0, rawScore - errorCount * 15 - warningCount * 5)
  const score = Math.min(100, penalized)

  // Goal alignment = how well rep ranges + compound ratio match goal
  const goal_alignment = Math.round(
    repScore * 0.5 + compoundScore * 0.5
  )

  return {
    score,
    grade: gradeScore(score),
    goal_alignment,
    issues,
    suggestions,
    volume_by_muscle: volumeByMuscle,
    push_pull_ratio: pushPullRatio,
    compound_ratio: compoundRatio,
    avg_rep_range_min: Math.round(avgMin),
    avg_rep_range_max: Math.round(avgMax),
  }
}
