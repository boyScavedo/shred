"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useExercises } from "@/lib/hooks/use-exercises"
import { useTemplateExercises, useAddTemplateExercise } from "@/lib/hooks/use-templates"

export default function AddExercisesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const allExercises = useExercises()
  const templateExercises = useTemplateExercises(id)
  const { mutate: addExercise, isPending } = useAddTemplateExercise()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const existingIds = new Set(templateExercises.map((te) => te.exercise_id))
  const availableExercises = allExercises.filter((ex) => !existingIds.has(ex.id))

  const toggleExercise = (exerciseId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(exerciseId)) {
        next.delete(exerciseId)
      } else {
        next.add(exerciseId)
      }
      return next
    })
  }

  const handleAdd = async () => {
    for (const exerciseId of selectedIds) {
      await addExercise({ templateId: id, exerciseId })
    }
    router.push(`/templates/${id}`)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Add Exercises</h1>

      {availableExercises.length === 0 ? (
        <p className="text-[#a0a0a0] text-sm text-center py-8">All exercises already added</p>
      ) : (
        <div className="space-y-1">
          {availableExercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => toggleExercise(ex.id)}
              className={`w-full text-left p-2 rounded transition-colors text-sm ${
                selectedIds.has(ex.id)
                  ? "bg-[#4f9cf7]/20 text-white"
                  : "hover:bg-[#2a2a2a] text-[#a0a0a0]"
              }`}
            >
              <span>{ex.name}</span>
              <span className="text-xs ml-2">{ex.muscle_group_primary}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-[#333] py-2 text-sm text-[#a0a0a0] hover:border-[#666] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={isPending || selectedIds.size === 0}
          className="flex-1 rounded-lg bg-[#4f9cf7] py-2 text-sm font-bold text-white hover:bg-[#3d8ae5] transition-colors disabled:opacity-50"
        >
          {isPending ? "Adding..." : `Add (${selectedIds.size})`}
        </button>
      </div>
    </div>
  )
}
