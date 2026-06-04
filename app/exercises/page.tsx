"use client"

import { useState } from "react"
import { useExercises } from "@/lib/hooks/use-exercises"
import type { MuscleGroup, MovementPattern } from "@/types"

const MUSCLE_GROUPS: { value: MuscleGroup | ""; label: string }[] = [
  { value: "", label: "All Groups" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "biceps", label: "Biceps" },
  { value: "triceps", label: "Triceps" },
  { value: "quads", label: "Quads" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "glutes", label: "Glutes" },
  { value: "calves", label: "Calves" },
  { value: "abs", label: "Abs" },
  { value: "forearms", label: "Forearms" },
  { value: "traps", label: "Traps" },
]

const MOVEMENT_PATTERNS: { value: MovementPattern | ""; label: string }[] = [
  { value: "", label: "All Patterns" },
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "squat", label: "Squat" },
  { value: "hinge", label: "Hinge" },
  { value: "core", label: "Core" },
  { value: "carry", label: "Carry" },
]

export default function ExercisesPage() {
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | "">("")
  const [movementPattern, setMovementPattern] = useState<MovementPattern | "">("")

  const exercises = useExercises({
    muscleGroup: muscleGroup || undefined,
    movementPattern: movementPattern || undefined,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Exercise Library</h1>

      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="muscle-group" className="sr-only">Muscle Group</label>
          <select
            id="muscle-group"
            aria-label="Muscle Group"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup | "")}
            className="w-full text-sm"
          >
            {MUSCLE_GROUPS.map((mg) => (
              <option key={mg.value} value={mg.value}>{mg.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="movement-pattern" className="sr-only">Movement Pattern</label>
          <select
            id="movement-pattern"
            aria-label="Movement Pattern"
            value={movementPattern}
            onChange={(e) => setMovementPattern(e.target.value as MovementPattern | "")}
            className="w-full text-sm"
          >
            {MOVEMENT_PATTERNS.map((mp) => (
              <option key={mp.value} value={mp.value}>{mp.label}</option>
            ))}
          </select>
        </div>
      </div>

      {exercises.length === 0 ? (
        <p className="text-[#a0a0a0] text-sm text-center py-8">No exercises found</p>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex) => (
            <div key={ex.id} className="rounded-lg bg-[#1a1a1a] p-3 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">{ex.name}</h3>
                <span className="text-[#4f9cf7] text-xs bg-[#4f9cf7]/10 px-2 py-0.5 rounded">
                  {ex.movement_pattern}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-[#a0a0a0]">
                <span>{ex.muscle_group_primary}</span>
                <span>{ex.mechanics}</span>
                <span>{ex.resistance_type.replace("_", " ")}</span>
              </div>
              <div className="text-xs text-[#a0a0a0]">
                {ex.load_type === "reps"
                  ? `${ex.default_sets}×${ex.default_reps_min}-${ex.default_reps_max}`
                  : `${ex.default_sets}×${ex.default_duration_secs}s`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
