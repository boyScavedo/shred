import type { Exercise, FitnessGoal, BodyGoal, ExperienceLevel, ResistanceType, MovementPattern, MuscleGroup } from "@/types"

export type TrainingSplit = "full_body" | "upper_lower" | "ppl" | "ppl_x2" | "push_pull" | "bro_split"

export interface SplitDay {
  label: string
  focus: string[]
  movement_patterns: MovementPattern[]
  muscle_groups: MuscleGroup[]
}

export interface SplitRecommendation {
  split: TrainingSplit
  days_per_week: number
  label: string
  rationale: string
  days: SplitDay[]
  rest_time_secs: { min: number; max: number }
  rep_range: { min: number; max: number }
  sets_per_exercise: { min: number; max: number }
  weekly_volume_target: { min: number; max: number }
  cut_adjustments: string[]
  bulk_adjustments: string[]
}

export interface ExerciseRecommendation {
  exercise: Exercise
  reason: string
  priority: "must_have" | "recommended" | "optional"
  target_sets: number
  target_reps_min: number
  target_reps_max: number
}

export interface WorkoutRecommendation {
  split: SplitRecommendation
  recommended_exercises: ExerciseRecommendation[]
  tips: string[]
  weekly_checklist: string[]
}

// --- Split selection ---

function selectSplit(
  days: number,
  goal: FitnessGoal,
  experience: ExperienceLevel,
): SplitRecommendation {
  if (days <= 3 || experience === "beginner") {
    return fullBodySplit(days, goal)
  }
  if (days === 4) {
    return upperLowerSplit(goal)
  }
  if (days === 5) {
    return pplSplit(goal)
  }
  return pplX2Split(goal)
}

function fullBodySplit(days: number, goal: FitnessGoal): SplitRecommendation {
  const dayLabels = ["Full Body A", "Full Body B", "Full Body C"].slice(0, days)
  return {
    split: "full_body",
    days_per_week: days,
    label: "Full Body",
    rationale: "Full body training maximises frequency per muscle — each group trained every session. Best for beginners and strength goals.",
    days: dayLabels.map((label, i) => ({
      label,
      focus: ["Full Body"],
      movement_patterns: ["push", "pull", "squat", "hinge", "core"],
      muscle_groups: ["chest", "back", "shoulders", "quads", "hamstrings", "glutes", "abs"],
    })),
    rest_time_secs: goal === "strength" ? { min: 180, max: 300 } : { min: 60, max: 90 },
    rep_range: repRange(goal),
    sets_per_exercise: setsPerExercise(goal),
    weekly_volume_target: weeklyVolumeTarget(goal),
    cut_adjustments: cutAdjustments(),
    bulk_adjustments: bulkAdjustments(),
  }
}

function upperLowerSplit(goal: FitnessGoal): SplitRecommendation {
  return {
    split: "upper_lower",
    days_per_week: 4,
    label: "Upper / Lower (4-day)",
    rationale: "Each muscle trained 2×/week — optimal frequency for hypertrophy and strength. Upper days: push + pull. Lower days: squat + hinge.",
    days: [
      { label: "Upper A", focus: ["Chest", "Back", "Shoulders", "Arms"], movement_patterns: ["push", "pull"], muscle_groups: ["chest", "back", "shoulders", "biceps", "triceps"] },
      { label: "Lower A", focus: ["Quads", "Hamstrings", "Glutes", "Calves"], movement_patterns: ["squat", "hinge", "core"], muscle_groups: ["quads", "hamstrings", "glutes", "calves", "abs"] },
      { label: "Upper B", focus: ["Chest", "Back", "Shoulders", "Arms"], movement_patterns: ["push", "pull"], muscle_groups: ["chest", "back", "shoulders", "biceps", "triceps"] },
      { label: "Lower B", focus: ["Quads", "Hamstrings", "Glutes", "Calves"], movement_patterns: ["squat", "hinge", "core"], muscle_groups: ["quads", "hamstrings", "glutes", "calves", "abs"] },
    ],
    rest_time_secs: goal === "strength" ? { min: 180, max: 300 } : { min: 60, max: 120 },
    rep_range: repRange(goal),
    sets_per_exercise: setsPerExercise(goal),
    weekly_volume_target: weeklyVolumeTarget(goal),
    cut_adjustments: cutAdjustments(),
    bulk_adjustments: bulkAdjustments(),
  }
}

function pplSplit(goal: FitnessGoal): SplitRecommendation {
  return {
    split: "ppl",
    days_per_week: 5,
    label: "Push / Pull / Legs (5-day)",
    rationale: "High volume per session, each muscle trained ~1.5×/week. Great for intermediate hypertrophy.",
    days: [
      { label: "Push", focus: ["Chest", "Shoulders", "Triceps"], movement_patterns: ["push"], muscle_groups: ["chest", "shoulders", "triceps"] },
      { label: "Pull", focus: ["Back", "Biceps", "Traps"], movement_patterns: ["pull"], muscle_groups: ["back", "biceps", "traps"] },
      { label: "Legs", focus: ["Quads", "Hamstrings", "Glutes", "Calves"], movement_patterns: ["squat", "hinge"], muscle_groups: ["quads", "hamstrings", "glutes", "calves"] },
      { label: "Push B", focus: ["Chest", "Shoulders", "Triceps"], movement_patterns: ["push"], muscle_groups: ["chest", "shoulders", "triceps"] },
      { label: "Pull B", focus: ["Back", "Biceps", "Traps"], movement_patterns: ["pull"], muscle_groups: ["back", "biceps", "traps"] },
    ],
    rest_time_secs: { min: 90, max: 150 },
    rep_range: repRange(goal),
    sets_per_exercise: setsPerExercise(goal),
    weekly_volume_target: weeklyVolumeTarget(goal),
    cut_adjustments: cutAdjustments(),
    bulk_adjustments: bulkAdjustments(),
  }
}

function pplX2Split(goal: FitnessGoal): SplitRecommendation {
  return {
    split: "ppl_x2",
    days_per_week: 6,
    label: "Push / Pull / Legs ×2 (6-day)",
    rationale: "Maximum frequency — each muscle trained 2×/week with high volume. Advanced trainees only.",
    days: [
      { label: "Push A", focus: ["Chest", "Shoulders", "Triceps"], movement_patterns: ["push"], muscle_groups: ["chest", "shoulders", "triceps"] },
      { label: "Pull A", focus: ["Back", "Biceps", "Traps"], movement_patterns: ["pull"], muscle_groups: ["back", "biceps", "traps"] },
      { label: "Legs A", focus: ["Quads", "Hamstrings", "Glutes"], movement_patterns: ["squat", "hinge"], muscle_groups: ["quads", "hamstrings", "glutes"] },
      { label: "Push B", focus: ["Chest", "Shoulders", "Triceps"], movement_patterns: ["push"], muscle_groups: ["chest", "shoulders", "triceps"] },
      { label: "Pull B", focus: ["Back", "Biceps", "Traps"], movement_patterns: ["pull"], muscle_groups: ["back", "biceps", "traps"] },
      { label: "Legs B", focus: ["Quads", "Hamstrings", "Glutes"], movement_patterns: ["squat", "hinge"], muscle_groups: ["quads", "hamstrings", "glutes"] },
    ],
    rest_time_secs: { min: 90, max: 180 },
    rep_range: repRange(goal),
    sets_per_exercise: setsPerExercise(goal),
    weekly_volume_target: weeklyVolumeTarget(goal),
    cut_adjustments: cutAdjustments(),
    bulk_adjustments: bulkAdjustments(),
  }
}

function repRange(goal: FitnessGoal): { min: number; max: number } {
  const map: Record<FitnessGoal, { min: number; max: number }> = {
    strength:    { min: 1,  max: 6  },
    hypertrophy: { min: 6,  max: 12 },
    endurance:   { min: 12, max: 20 },
    general:     { min: 6,  max: 15 },
  }
  return map[goal]
}

function setsPerExercise(goal: FitnessGoal): { min: number; max: number } {
  const map: Record<FitnessGoal, { min: number; max: number }> = {
    strength:    { min: 3, max: 5 },
    hypertrophy: { min: 3, max: 5 },
    endurance:   { min: 2, max: 4 },
    general:     { min: 3, max: 4 },
  }
  return map[goal]
}

function weeklyVolumeTarget(goal: FitnessGoal): { min: number; max: number } {
  const map: Record<FitnessGoal, { min: number; max: number }> = {
    strength:    { min: 10, max: 15 },
    hypertrophy: { min: 15, max: 20 },
    endurance:   { min: 20, max: 25 },
    general:     { min: 10, max: 18 },
  }
  return map[goal]
}

function cutAdjustments(): string[] {
  return [
    "Reduce rest times to 45–60s for metabolic effect",
    "Maintain intensity — keep weights heavy to preserve muscle",
    "Add 1–2 conditioning finishers (circuits, carries)",
    "Aim for ~2.2g protein per kg bodyweight",
    "Consider reducing volume 20% from peak — you're in a deficit",
  ]
}

function bulkAdjustments(): string[] {
  return [
    "Rest 2–5 minutes between heavy compound sets",
    "Add weight or reps every session — progressive overload is mandatory",
    "Eat 200–500 kcal above maintenance — track for accuracy",
    "Prioritise sleep 8h+ for recovery and anabolic hormones",
    "Consider a deload week every 6–8 weeks",
  ]
}

// --- Exercise recommendation ---

function scoreExerciseForGoal(ex: Exercise, goal: FitnessGoal, equipment: ResistanceType[]): number {
  let score = 0

  // Equipment match
  const needsEquipment = ex.equipment_required.length > 0
  const hasEquipment = ex.equipment_required.every((e) => equipment.includes(e as ResistanceType))
  if (needsEquipment && !hasEquipment) return -1

  // Compound bonus by goal
  if (ex.mechanics === "compound") {
    score += goal === "strength" ? 30 : goal === "hypertrophy" ? 20 : 10
  }

  // Rep range alignment
  const { min: rMin, max: rMax } = repRange(goal)
  const eMin = ex.default_reps_min ?? 8
  const eMax = ex.default_reps_max ?? 12
  const overlap = Math.min(eMax, rMax) - Math.max(eMin, rMin)
  score += Math.max(0, overlap) * 3

  // Movement pattern diversity bonus (just a nudge)
  score += 5

  return score
}

function buildExerciseRecommendations(
  exercises: Exercise[],
  goal: FitnessGoal,
  body_goal: BodyGoal,
  equipment: ResistanceType[],
  experience: ExperienceLevel,
): ExerciseRecommendation[] {
  const { min: rMin, max: rMax } = repRange(goal)
  const { min: sMin } = setsPerExercise(goal)

  // Prioritise key movement patterns
  const priority_patterns: MovementPattern[] = ["squat", "hinge", "push", "pull", "core"]

  const recommendations: ExerciseRecommendation[] = []
  const usedPatterns = new Set<MovementPattern>()

  // Must-have: one compound per priority pattern
  for (const pattern of priority_patterns) {
    const candidates = exercises
      .filter((e) => e.movement_pattern === pattern && e.mechanics === "compound")
      .map((e) => ({ e, score: scoreExerciseForGoal(e, goal, equipment) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)

    if (candidates.length > 0) {
      const best = candidates[0].e
      recommendations.push({
        exercise: best,
        reason: `Key ${pattern} movement — foundational for ${goal}`,
        priority: "must_have",
        target_sets: sMin + 1,
        target_reps_min: rMin,
        target_reps_max: rMax,
      })
      usedPatterns.add(pattern)
    }
  }

  // Recommended: secondary compounds + isolation
  for (const ex of exercises) {
    if (recommendations.some((r) => r.exercise.id === ex.id)) continue
    const score = scoreExerciseForGoal(ex, goal, equipment)
    if (score < 0) continue

    const alreadyHasPatternCompound = recommendations.some(
      (r) => r.exercise.movement_pattern === ex.movement_pattern && r.exercise.mechanics === "compound"
    )

    if (ex.mechanics === "compound" && !alreadyHasPatternCompound) {
      recommendations.push({
        exercise: ex,
        reason: `Additional ${ex.movement_pattern} compound`,
        priority: "recommended",
        target_sets: sMin,
        target_reps_min: rMin,
        target_reps_max: rMax,
      })
    } else if (ex.mechanics === "isolation" && goal === "hypertrophy") {
      recommendations.push({
        exercise: ex,
        reason: `Isolation for ${ex.muscle_group_primary} — metabolic stress for hypertrophy`,
        priority: "optional",
        target_sets: sMin,
        target_reps_min: rMin + 2,
        target_reps_max: rMax + 4,
      })
    }
  }

  // Cutting: trim optional exercises
  if (body_goal === "cutting") {
    return recommendations.filter((r) => r.priority !== "optional").slice(0, 15)
  }

  return recommendations.slice(0, 20)
}

function buildTips(goal: FitnessGoal, body_goal: BodyGoal, experience: ExperienceLevel): string[] {
  const tips: string[] = []

  if (experience === "beginner") {
    tips.push("Focus on form before adding weight — film yourself to check technique.")
    tips.push("Beginner gains are real: you can make progress on almost any programme. Consistency > perfection.")
    tips.push("Start conservative with weight — you should be able to do 2 more reps than you stop at.")
  }

  if (experience === "intermediate") {
    tips.push("Beginner linear progression is over — plan in mesocycles (4–8 week blocks).")
    tips.push("Track every session — if you can't beat last week's reps/weight, investigate sleep, stress, food.")
  }

  if (experience === "advanced") {
    tips.push("Autoregulation: use RPE 7–9 rather than fixed weights — daily readiness varies.")
    tips.push("Periodise — alternate accumulation (high volume) and intensification (high intensity) blocks.")
    tips.push("Consider specialisation blocks: focus 1 lagging muscle group for 6–8 weeks.")
  }

  if (goal === "strength") {
    tips.push("The big 3 (squat, bench, deadlift) or equivalent should be session anchors.")
    tips.push("Deload every 4–6 weeks — strength is built during recovery, not training.")
    tips.push("Sleep 8–9h. Growth hormone peaks in deep sleep.")
  }

  if (goal === "hypertrophy") {
    tips.push("Progressive overload is mandatory — add weight or reps every session.")
    tips.push("Train close to failure (1–3 RIR) on most sets for maximum hypertrophy stimulus.")
    tips.push("Protein: 1.6–2.2g per kg bodyweight daily — distribute across 4+ meals.")
  }

  if (goal === "endurance") {
    tips.push("Combine resistance training with zone-2 cardio for comprehensive endurance.")
    tips.push("Circuit training (minimal rest) builds muscular and cardiovascular endurance simultaneously.")
    tips.push("Hydration is critical — even 2% dehydration drops endurance performance significantly.")
  }

  if (body_goal === "cutting") {
    tips.push("Maintain strength as a KPI — if your lifts drop >10%, you're losing muscle too fast.")
    tips.push("Cardio: 150–300 min/week moderate intensity. LISS (walking, cycling) preserves muscle best.")
    tips.push("Weigh yourself daily, take 7-day rolling average — daily fluctuations are noise.")
  }

  if (body_goal === "bulking") {
    tips.push("Dirty bulking causes excess fat gain — stay within 200–500 kcal surplus.")
    tips.push("If gaining >1kg/week, reduce calories — you're adding excess fat.")
    tips.push("Creatine monohydrate (3–5g/day) is the most evidence-backed supplement for strength + hypertrophy.")
  }

  return tips
}

function buildWeeklyChecklist(goal: FitnessGoal, body_goal: BodyGoal, days: number): string[] {
  const checklist: string[] = [
    `Complete all ${days} training sessions`,
    "Hit protein target every day",
    "Get 7–9 hours of sleep each night",
    "Log every set, rep, and weight in SHRED",
  ]

  if (goal === "strength") {
    checklist.push("Beat last week's weight or reps on main lifts")
    checklist.push("Note RPE — if >9 consistently, deload next week")
  }

  if (goal === "hypertrophy") {
    checklist.push("Train within 1–3 reps of failure on work sets")
    checklist.push("Track weekly tonnage (sets × reps × weight) — should trend up")
  }

  if (body_goal === "cutting") {
    checklist.push("Track calories — stay within 300–500 kcal deficit")
    checklist.push("Take weekly progress photos (same time, same lighting)")
  }

  if (body_goal === "bulking") {
    checklist.push("Track scale weight daily — aim for +0.25–0.5kg/week")
    checklist.push("Review progressive overload — are all lifts moving up?")
  }

  return checklist
}

// --- Main export ---

export interface GenerateInput {
  goal: FitnessGoal
  body_goal: BodyGoal
  experience: ExperienceLevel
  days_per_week: number
  equipment: ResistanceType[]
  exercises: Exercise[]
}

export function generateRecommendation(input: GenerateInput): WorkoutRecommendation {
  const { goal, body_goal, experience, days_per_week, equipment, exercises } = input

  const split = selectSplit(days_per_week, goal, experience)
  const recommended_exercises = buildExerciseRecommendations(exercises, goal, body_goal, equipment, experience)
  const tips = buildTips(goal, body_goal, experience)
  const weekly_checklist = buildWeeklyChecklist(goal, body_goal, days_per_week)

  return { split, recommended_exercises, tips, weekly_checklist }
}

// --- Graded plans ---

export type PlanGrade = "S" | "A" | "B"

export interface GradedPlanDay {
  label: string
  exercises: ExerciseRecommendation[]
}

export interface GradedPlan {
  grade: PlanGrade
  title: string
  description: string
  recommendation: WorkoutRecommendation
  planDays: GradedPlanDay[]
}

function distributeExercisesToDays(
  splitDays: SplitDay[],
  exercises: ExerciseRecommendation[],
  maxPerDay: number,
): GradedPlanDay[] {
  return splitDays.map((day) => ({
    label: day.label,
    exercises: exercises
      .filter((ex) => day.movement_patterns.includes(ex.exercise.movement_pattern))
      .slice(0, maxPerDay),
  }))
}

export function generateGradedPlans(input: GenerateInput): GradedPlan[] {
  // S tier — optimal for exact profile
  const sPlan = generateRecommendation(input)
  const sExercises = sPlan.recommended_exercises
  const sPlanDays = distributeExercisesToDays(sPlan.split.days, sExercises, 6)

  // A tier — same split, trim to must_have + recommended only, -1 set target
  const aPlan = generateRecommendation(input)
  const aExercises = aPlan.recommended_exercises.filter((e) => e.priority !== "optional").map((e) => ({
    ...e,
    target_sets: Math.max(2, e.target_sets - 1),
  }))
  const aPlanDays = distributeExercisesToDays(aPlan.split.days, aExercises, 5)

  // B tier — full body regardless, compounds only, conservative
  const bInput: GenerateInput = {
    ...input,
    experience: "beginner",
    days_per_week: Math.min(input.days_per_week, 3),
  }
  const bPlan = generateRecommendation(bInput)
  const bExercises = bPlan.recommended_exercises
    .filter((e) => e.exercise.mechanics === "compound" && e.priority === "must_have")
    .map((e) => ({ ...e, target_sets: 3 }))
  const bPlanDays = distributeExercisesToDays(bPlan.split.days, bExercises, 4)

  return [
    {
      grade: "S",
      title: "S-Tier — Optimal",
      description: `Perfect alignment with your ${input.goal} goal. ${sPlan.split.label} split, full volume, all movement patterns covered. Maximum stimulus.`,
      recommendation: sPlan,
      planDays: sPlanDays,
    },
    {
      grade: "A",
      title: "A-Tier — Balanced",
      description: `Excellent results with lower fatigue. Same split but trimmed to core movements and 1 fewer set per exercise. Sustainable long-term.`,
      recommendation: aPlan,
      planDays: aPlanDays,
    },
    {
      grade: "B",
      title: "B-Tier — Accessible",
      description: `Full body approach, ${bInput.days_per_week}×/week, compounds only. Ideal for building the habit or returning from a break. No optional isolations.`,
      recommendation: bPlan,
      planDays: bPlanDays,
    },
  ]
}
