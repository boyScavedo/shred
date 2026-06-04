"use client"

import { useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useTemplate, useTemplateExercises, useDeleteTemplate, useRemoveTemplateExercise, useUpdateTemplateExercise, useStartWorkoutFromTemplate } from "@/lib/hooks/use-templates"
import { useExercise } from "@/lib/hooks/use-exercises"
import type { TemplateExercise } from "@/types"

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function TemplateExerciseRow({
  te,
  onRemoved,
}: {
  te: TemplateExercise
  onRemoved: () => void
}) {
  const exercise = useExercise(te.exercise_id)
  const { mutate: updateExercise } = useUpdateTemplateExercise()
  const { mutate: removeExercise } = useRemoveTemplateExercise()
  const [editing, setEditing] = useState(false)

  const [sets, setSets] = useState(te.target_sets)
  const [repsMin, setRepsMin] = useState(te.target_reps_min ?? 8)
  const [repsMax, setRepsMax] = useState(te.target_reps_max ?? 12)
  const [restSecs, setRestSecs] = useState(te.rest_secs)
  const [restAfterSecs, setRestAfterSecs] = useState(te.rest_after_exercise_secs ?? 180)

  const handleRemove = async () => {
    await removeExercise(te.id)
    onRemoved()
  }

  const handleSave = async () => {
    await updateExercise({
      id: te.id,
      target_sets: sets,
      target_reps_min: repsMin,
      target_reps_max: repsMax,
      rest_secs: restSecs,
      rest_after_exercise_secs: restAfterSecs,
    })
    setEditing(false)
  }

  if (!exercise) return null

  return (
    <div className="rounded-lg bg-[#1a1a1a] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">{exercise.name}</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-[#4f9cf7] hover:text-[#3d8ae5] transition-colors"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={handleRemove}
            className="text-[#ef4444] hover:text-[#dc2626] transition-colors"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {!editing ? (
        <div className="flex gap-3 text-xs text-[#a0a0a0] flex-wrap">
          <span>{te.target_sets} sets</span>
          {te.target_reps_min != null && te.target_reps_max != null && (
            <span>{te.target_reps_min}–{te.target_reps_max} reps</span>
          )}
          <span>{te.rest_secs}s rest/set</span>
          <span>{te.rest_after_exercise_secs ?? 180}s rest/exercise</span>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-1">Sets</label>
              <input
                type="number"
                inputMode="numeric"
                value={sets}
                onChange={(e) => setSets(Number(e.target.value))}
                min={1}
                max={10}
                className="w-full rounded border border-[#2a2a2a] bg-[#111] px-2 py-1 text-sm text-center focus:border-[#4f9cf7] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-1">Reps min</label>
              <input
                type="number"
                inputMode="numeric"
                value={repsMin}
                onChange={(e) => setRepsMin(Number(e.target.value))}
                min={1}
                className="w-full rounded border border-[#2a2a2a] bg-[#111] px-2 py-1 text-sm text-center focus:border-[#4f9cf7] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-1">Reps max</label>
              <input
                type="number"
                inputMode="numeric"
                value={repsMax}
                onChange={(e) => setRepsMax(Number(e.target.value))}
                min={1}
                className="w-full rounded border border-[#2a2a2a] bg-[#111] px-2 py-1 text-sm text-center focus:border-[#4f9cf7] focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-1">Rest between sets (s)</label>
              <input
                type="number"
                inputMode="numeric"
                value={restSecs}
                onChange={(e) => setRestSecs(Number(e.target.value))}
                min={0}
                step={15}
                className="w-full rounded border border-[#2a2a2a] bg-[#111] px-2 py-1 text-sm text-center focus:border-[#4f9cf7] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-1">Rest after exercise (s)</label>
              <input
                type="number"
                inputMode="numeric"
                value={restAfterSecs}
                onChange={(e) => setRestAfterSecs(Number(e.target.value))}
                min={0}
                step={15}
                className="w-full rounded border border-[#2a2a2a] bg-[#111] px-2 py-1 text-sm text-center focus:border-[#4f9cf7] focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-[#4f9cf7] py-1.5 text-sm font-bold text-white hover:bg-[#3d8ae5] transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const template = useTemplate(id)
  const templateExercises = useTemplateExercises(id)
  const { mutate: deleteTemplate, isPending: deleting } = useDeleteTemplate()
  const { mutate: startWorkout, isPending: starting } = useStartWorkoutFromTemplate()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleDelete = async () => {
    await deleteTemplate(id)
    router.push("/templates")
  }

  const handleStartWorkout = async () => {
    await startWorkout(id)
    router.push("/workout")
  }

  const handleExerciseRemoved = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  if (!template) {
    return (
      <div className="space-y-4 text-center py-12">
        <h1 className="text-xl font-bold">Template not found</h1>
        <button
          onClick={() => router.push("/templates")}
          className="rounded-lg bg-[#4f9cf7] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#3d8ae5] transition-colors"
        >
          Back to Templates
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{template.name}</h1>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-bold text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {template.description && (
        <p className="text-sm text-[#a0a0a0]">{template.description}</p>
      )}

      <button
        onClick={handleStartWorkout}
        disabled={starting || templateExercises.length === 0}
        className="w-full rounded-lg bg-[#22c55e] py-2 font-bold text-white hover:bg-[#16a34a] transition-colors disabled:opacity-50"
      >
        {starting ? "Starting..." : "Start Workout"}
      </button>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-[#a0a0a0]">Exercises</h2>
        {templateExercises.length === 0 ? (
          <p className="text-sm text-[#666] text-center py-4">No exercises in this template</p>
        ) : (
          templateExercises.map((te) => (
            <TemplateExerciseRow
              key={`${te.id}-${refreshKey}`}
              te={te}
              onRemoved={handleExerciseRemoved}
            />
          ))
        )}
      </div>

      <button
        onClick={() => router.push(`/templates/${id}/add-exercises`)}
        className="w-full rounded-lg border border-dashed border-[#333] py-2 text-sm text-[#a0a0a0] hover:border-[#4f9cf7] hover:text-[#4f9cf7] transition-colors"
      >
        + Add Exercises
      </button>

      {templateExercises.length > 0 && (
        <Link
          href={`/templates/${id}/analyze`}
          className="block w-full rounded-lg border border-[#4f9cf7]/30 bg-[#4f9cf7]/5 py-2 text-sm text-center text-[#4f9cf7] hover:bg-[#4f9cf7]/10 transition-colors"
        >
          Analyze Plan →
        </Link>
      )}
    </div>
  )
}
