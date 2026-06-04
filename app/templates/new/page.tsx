"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useExercises } from "@/lib/hooks/use-exercises"
import { useCreateTemplate, useAddTemplateExercise } from "@/lib/hooks/use-templates"

export default function NewTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const exercises = useExercises()
  const { mutate: createTemplate } = useCreateTemplate()
  const { mutate: addExercise } = useAddTemplateExercise()

  const toggleExercise = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Template name is required")
      return
    }
    setError(null)
    setIsSaving(true)

    const templateId = await createTemplate({ name: name.trim(), description: description.trim() || undefined })

    for (const exerciseId of selectedIds) {
      await addExercise({ templateId, exerciseId })
    }

    setIsSaving(false)
    router.push(`/templates/${templateId}`)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">New Template</h1>

      <div>
        <label htmlFor="name" className="block text-sm font-bold text-[#a0a0a0] mb-1">
          Template Name
        </label>
        <input
          id="name"
          aria-label="Template Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Push Day"
          className="w-full text-sm"
        />
      </div>

      <div>
        <label htmlFor="desc" className="block text-sm font-bold text-[#a0a0a0] mb-1">
          Description (optional)
        </label>
        <textarea
          id="desc"
          aria-label="Template Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Chest, shoulders, triceps"
          rows={2}
          className="w-full text-sm resize-none"
        />
      </div>

      <div>
        <h2 className="text-sm font-bold text-[#a0a0a0] mb-2">Exercises</h2>
        <div className="space-y-1">
          {exercises.map((ex) => (
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
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full rounded-lg bg-[#4f9cf7] py-2 font-bold text-white hover:bg-[#3d8ae5] transition-colors disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save Template"}
      </button>
    </div>
  )
}
