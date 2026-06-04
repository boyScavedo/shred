"use client"

import { useRouter } from "next/navigation"
import { useTemplates, useTemplateExercises } from "@/lib/hooks/use-templates"

function TemplateCard({ id, name, description }: { id: string; name: string; description: string | null }) {
  const router = useRouter()
  const exercises = useTemplateExercises(id)

  return (
    <button
      onClick={() => router.push(`/templates/${id}`)}
      className="w-full text-left rounded-lg bg-[#1a1a1a] p-3 space-y-1 hover:bg-[#222] transition-colors"
    >
      <h3 className="font-bold text-sm">{name}</h3>
      {description && (
        <p className="text-xs text-[#a0a0a0] line-clamp-1">{description}</p>
      )}
      <p className="text-xs text-[#4f9cf7]">{exercises.length} exercises</p>
    </button>
  )
}

export default function TemplatesPage() {
  const router = useRouter()
  const templates = useTemplates()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Templates</h1>
        <button
          onClick={() => router.push("/templates/new")}
          className="rounded-lg bg-[#4f9cf7] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#3d8ae5] transition-colors"
        >
          Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="text-[#a0a0a0] text-sm text-center py-8">
          No templates yet. Create one to get started!
        </p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <TemplateCard key={t.id} id={t.id} name={t.name} description={t.description} />
          ))}
        </div>
      )}
    </div>
  )
}
