"use client"

import { RPE_SCALE, type ProgressiveOverloadDecision } from "@/types"
import type { Exercise, WorkoutExercise, WorkoutSet } from "@/types"
import type { PreviousPerformance, PersonalRecord } from "@/lib/hooks/use-previous-performance"
import { estimateOneRepMax } from "@/lib/workout-timer"

function isBodyweightMode(prescriptionMode: string): boolean {
  return prescriptionMode === "bodyweight_reps" || prescriptionMode === "bodyweight_duration"
}

const PROGRESSION_COLORS: Record<string, string> = {
  increase_weight:    "text-[#22c55e]",
  increase_reps:      "text-[#22c55e]",
  advance_variation:  "text-[#4f9cf7]",
  maintain:           "text-[#a0a0a0]",
  deload:             "text-[#f59e0b]",
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

interface ExerciseBlockProps {
  workoutExercise: WorkoutExercise
  exercise: Exercise
  sets: WorkoutSet[]
  onUpdateSet: (set: Partial<WorkoutSet> & { id: string }) => void
  onAddSet: () => void
  onRemove: () => void
  onSetCompleted?: (set: WorkoutSet) => void
  progression?: ProgressiveOverloadDecision | null
  previousPerformance?: PreviousPerformance | null
  personalRecord?: PersonalRecord | null
}

function SetRow({
  set,
  loadType,
  isBw,
  onUpdateSet,
  onSetCompleted,
  ghostSet,
  isPR,
}: {
  set: WorkoutSet
  loadType: string
  isBw: boolean
  onUpdateSet: (set: Partial<WorkoutSet> & { id: string }) => void
  onSetCompleted?: (set: WorkoutSet) => void
  ghostSet?: { reps: number | null; weight_kg: number | null; duration_secs: number | null }
  isPR?: boolean
}) {
  const estimated1rm =
    set.weight_kg && set.reps && set.reps > 0
      ? estimateOneRepMax(set.weight_kg, set.reps)
      : null

  const handleComplete = (checked: boolean) => {
    const updated = { ...set, is_completed: checked }
    onUpdateSet({ id: set.id, is_completed: checked })
    if (checked && onSetCompleted) onSetCompleted(updated)
  }

  return (
    <div className={`rounded py-1.5 px-1 transition-colors ${set.is_completed ? "bg-[#22c55e]/5" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="w-5 text-xs text-[#a0a0a0] text-center shrink-0">{set.set_number}</span>

        {loadType === "reps" ? (
          <input
            type="number"
            inputMode="numeric"
            aria-label={`Set ${set.set_number} reps`}
            value={set.reps ?? ""}
            onChange={(e) => onUpdateSet({ id: set.id, reps: e.target.value ? Number(e.target.value) : null })}
            className="w-14 sm:w-16 text-sm text-center bg-[#111] border border-[#2a2a2a] rounded px-1 py-1.5 min-h-[38px] focus:border-[#4f9cf7] focus:outline-none"
            min={0}
            placeholder={ghostSet?.reps ? String(ghostSet.reps) : "reps"}
          />
        ) : (
          <input
            type="number"
            inputMode="numeric"
            aria-label={`Set ${set.set_number} duration (s)`}
            value={set.duration_secs ?? ""}
            onChange={(e) => onUpdateSet({ id: set.id, duration_secs: e.target.value ? Number(e.target.value) : null })}
            className="w-14 sm:w-16 text-sm text-center bg-[#111] border border-[#2a2a2a] rounded px-1 py-1.5 min-h-[38px] focus:border-[#4f9cf7] focus:outline-none"
            min={0}
            placeholder={ghostSet?.duration_secs ? String(ghostSet.duration_secs) : "secs"}
          />
        )}

        {!isBw && (
          <input
            type="number"
            inputMode="decimal"
            aria-label={`Set ${set.set_number} weight (kg)`}
            value={set.weight_kg ?? ""}
            onChange={(e) => onUpdateSet({ id: set.id, weight_kg: e.target.value ? Number(e.target.value) : null })}
            className="w-14 sm:w-16 text-sm text-center bg-[#111] border border-[#2a2a2a] rounded px-1 py-1.5 min-h-[38px] focus:border-[#4f9cf7] focus:outline-none"
            min={0}
            placeholder={ghostSet?.weight_kg ? String(ghostSet.weight_kg) : "kg"}
          />
        )}

        <select
          aria-label={`Set ${set.set_number} RPE`}
          value={set.rpe ?? ""}
          onChange={(e) => onUpdateSet({ id: set.id, rpe: e.target.value ? Number(e.target.value) : null })}
          className="min-w-[52px] flex-1 text-xs text-center bg-[#111] border border-[#2a2a2a] rounded px-1 py-1.5 min-h-[38px] focus:border-[#4f9cf7] focus:outline-none appearance-none"
        >
          <option value="">RPE</option>
          {RPE_SCALE.map((rpe) => (
            <option key={rpe.value} value={rpe.value}>{rpe.label}</option>
          ))}
        </select>

        <label className="flex items-center justify-center cursor-pointer shrink-0 min-w-[36px] min-h-[38px]">
          <input
            type="checkbox"
            aria-label={`Set ${set.set_number} completed`}
            checked={set.is_completed}
            onChange={(e) => handleComplete(e.target.checked)}
            className="w-5 h-5 accent-[#22c55e]"
          />
        </label>
      </div>

      {set.is_completed && estimated1rm && (
        <div className="flex items-center gap-2 mt-0.5 pl-7">
          <span className="text-[10px] text-[#666]">e1RM {estimated1rm}kg</span>
          {isPR && (
            <span className="text-[10px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-1 rounded">PR</span>
          )}
        </div>
      )}
    </div>
  )
}

export function ExerciseBlock({
  workoutExercise,
  exercise,
  sets,
  onUpdateSet,
  onAddSet,
  onRemove,
  onSetCompleted,
  progression,
  previousPerformance,
  personalRecord,
}: ExerciseBlockProps) {
  const bw = isBodyweightMode(exercise.prescription_mode)
  const sorted = [...sets].sort((a, b) => a.set_number - b.set_number)

  const prevDate = previousPerformance?.date
    ? new Date(previousPerformance.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null

  return (
    <div className="rounded-lg bg-[#1a1a1a] p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm truncate">{exercise.name}</h3>
            {personalRecord && (
              <span className="text-[10px] text-[#f59e0b] shrink-0">
                PR {personalRecord.weight_kg}kg×{personalRecord.reps}
              </span>
            )}
          </div>
          <p className="text-xs text-[#a0a0a0]">
            {exercise.default_sets}
            {exercise.load_type === "reps"
              ? `×${exercise.default_reps_min}–${exercise.default_reps_max} reps`
              : `×${exercise.default_duration_secs}s`}
            {prevDate && <span className="text-[#555] ml-2">Last: {prevDate}</span>}
          </p>
        </div>
        <button
          onClick={onRemove}
          aria-label="Remove exercise"
          className="text-[#ef4444] hover:text-[#dc2626] transition-colors shrink-0 ml-2 p-1"
        >
          <TrashIcon />
        </button>
      </div>

      {progression && (
        <p className={`text-xs ${PROGRESSION_COLORS[progression.action] ?? "text-[#a0a0a0]"}`}>
          {progression.reason}
        </p>
      )}

      <div className="border-t border-[#2a2a2a] pt-2">
        <div className="flex items-center gap-2 pb-1">
          <span className="w-5 text-xs text-[#444] text-center shrink-0">#</span>
          <span className="w-16 text-xs text-[#444] text-center">
            {exercise.load_type === "reps" ? "Reps" : "Secs"}
          </span>
          {!bw && <span className="w-16 text-xs text-[#444] text-center">kg</span>}
          <span className="flex-1 text-xs text-[#444] text-center">RPE</span>
          <span className="text-xs text-[#444] shrink-0">✓</span>
        </div>

        {sorted.map((s) => {
          const ghostSet = previousPerformance?.sets.find((p) => p.set_number === s.set_number)
          const currentE1rm = s.weight_kg && s.reps ? estimateOneRepMax(s.weight_kg, s.reps) : 0
          const isPR = personalRecord ? currentE1rm > personalRecord.estimated_1rm : false
          return (
            <SetRow
              key={s.id}
              set={s}
              loadType={exercise.load_type}
              isBw={bw}
              onUpdateSet={onUpdateSet}
              onSetCompleted={onSetCompleted}
              ghostSet={ghostSet}
              isPR={isPR && s.is_completed}
            />
          )
        })}
      </div>

      <button
        onClick={onAddSet}
        className="w-full text-xs text-[#4f9cf7] hover:text-[#3d8ae5] transition-colors pt-1 text-center"
      >
        + Add Set
      </button>
    </div>
  )
}
