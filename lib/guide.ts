import type { Exercise, MuscleGroup } from "@/types"

export interface GuideExercise {
  exercise: Exercise
  targetSets: number
  targetRepsMin: number | null
  targetRepsMax: number | null
}

export interface WeeklyPlanDay {
  day: number
  label: string
  muscleGroups: MuscleGroup[]
  exercises: GuideExercise[]
}

interface RecentSetInfo {
  sessionCompletedAt: string
  muscleGroups: MuscleGroup[]
}

interface GuideInput {
  exercises: Exercise[]
  recentSets: RecentSetInfo[]
}

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const MOVEMENT_TO_GROUPS: Record<string, MuscleGroup[]> = {
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps", "forearms"],
  squat: ["quads", "glutes"],
  hinge: ["hamstrings", "glutes"],
  core: ["abs"],
  carry: ["forearms", "traps"],
}

function getGroupsForExercise(ex: Exercise): MuscleGroup[] {
  const groups = MOVEMENT_TO_GROUPS[ex.movement_pattern] ?? [ex.muscle_group_primary]
  if (ex.muscle_group_secondary && !groups.includes(ex.muscle_group_secondary)) {
    groups.push(ex.muscle_group_secondary)
  }
  return groups
}

function isWithinHours(dateStr: string, hours: number): boolean {
  const then = new Date(dateStr).getTime()
  const now = Date.now()
  return (now - then) < hours * 60 * 60 * 1000
}

function getRecoveredGroups(recentSets: RecentSetInfo[]): Set<MuscleGroup> {
  const recovered = new Set<MuscleGroup>()
  const allGroups: MuscleGroup[] = ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "abs", "forearms", "traps"]
  allGroups.forEach((g) => recovered.add(g))

  for (const rs of recentSets) {
    if (isWithinHours(rs.sessionCompletedAt, 48)) {
      for (const mg of rs.muscleGroups) {
        recovered.delete(mg)
      }
    }
  }

  return recovered
}

const DAY_PATTERNS: { day: number; movementPatterns: string[]; label: string }[] = [
  { day: 0, movementPatterns: ["push", "core"], label: "Push + Core" },
  { day: 1, movementPatterns: ["pull", "core"], label: "Pull + Core" },
  { day: 2, movementPatterns: ["squat", "hinge"], label: "Leg Day" },
  { day: 3, movementPatterns: ["push", "core"], label: "Push + Core" },
  { day: 4, movementPatterns: ["pull", "core"], label: "Pull + Core" },
  { day: 5, movementPatterns: ["squat", "hinge"], label: "Leg Day" },
  { day: 6, movementPatterns: ["core"], label: "Active Recovery" },
]

export function generateWeeklyPlan(input: GuideInput): WeeklyPlanDay[] {
  const { exercises, recentSets } = input

  if (exercises.length === 0) return []

  const recovered = getRecoveredGroups(recentSets)

  const grouped: Record<string, Exercise[]> = {}
  for (const ex of exercises) {
    const pattern = ex.movement_pattern
    if (!grouped[pattern]) grouped[pattern] = []
    grouped[pattern].push(ex)
  }

  const activePatterns = Object.keys(grouped)

  const plan: WeeklyPlanDay[] = []

  for (const pattern of DAY_PATTERNS) {
    const applicablePatterns = pattern.movementPatterns.filter((mp) => activePatterns.includes(mp))
    if (applicablePatterns.length === 0) continue

    const targetedGroups = new Set<MuscleGroup>()
    for (const mp of applicablePatterns) {
      for (const mg of MOVEMENT_TO_GROUPS[mp] ?? []) {
        targetedGroups.add(mg)
      }
    }

    const allowedGroups = [...targetedGroups].filter((mg) => recovered.has(mg))
    if (allowedGroups.length === 0) continue

    const dayExercises: GuideExercise[] = []
    for (const mp of applicablePatterns) {
      for (const ex of grouped[mp] ?? []) {
        const exGroups = getGroupsForExercise(ex)
        if (exGroups.some((mg) => recovered.has(mg))) {
          dayExercises.push({
            exercise: ex,
            targetSets: ex.default_sets,
            targetRepsMin: ex.default_reps_min,
            targetRepsMax: ex.default_reps_max,
          })
        }
      }
    }

    if (dayExercises.length === 0) continue

    plan.push({
      day: pattern.day,
      label: pattern.label,
      muscleGroups: allowedGroups,
      exercises: dayExercises,
    })
  }

  return plan
}
