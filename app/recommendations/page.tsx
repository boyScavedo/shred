"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRecommendations } from "@/lib/hooks/use-recommendations"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { db } from "@/lib/db"
import { enqueueMutation } from "@/lib/sync"
import type { GradedPlan, GradedPlanDay, PlanGrade } from "@/lib/recommendations"
import type { ExerciseTemplate, TemplateExercise } from "@/types"

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function now(): string {
  return new Date().toISOString()
}

const GRADE_COLORS: Record<PlanGrade, { border: string; bg: string; text: string; badge: string }> = {
  S: { border: "border-[#f59e0b]", bg: "bg-[#f59e0b]/5", text: "text-[#f59e0b]", badge: "bg-[#f59e0b] text-black" },
  A: { border: "border-[#4f9cf7]", bg: "bg-[#4f9cf7]/5", text: "text-[#4f9cf7]", badge: "bg-[#4f9cf7] text-white" },
  B: { border: "border-[#22c55e]", bg: "bg-[#22c55e]/5", text: "text-[#22c55e]", badge: "bg-[#22c55e] text-white" },
}

async function savePlanAsTemplates(plan: GradedPlan, gradeLabel: string): Promise<void> {
  for (let i = 0; i < plan.planDays.length; i++) {
    const day: GradedPlanDay = plan.planDays[i]
    if (day.exercises.length === 0) continue

    const templateId = uid()
    const ts = now()
    const template: ExerciseTemplate = {
      id: templateId,
      name: `${gradeLabel} · ${day.label}`,
      description: plan.description,
      created_at: ts,
      updated_at: ts,
    }
    await db.exercise_templates.add(template)
    enqueueMutation({ tableName: "exercise_templates", recordId: templateId, operation: "insert", payload: template })

    for (let j = 0; j < day.exercises.length; j++) {
      const rec = day.exercises[j]
      const teId = uid()
      const te: TemplateExercise = {
        id: teId,
        template_id: templateId,
        exercise_id: rec.exercise.id,
        sort_order: j + 1,
        target_sets: rec.target_sets,
        target_reps_min: rec.target_reps_min,
        target_reps_max: rec.target_reps_max,
        target_weight_kg: null,
        rest_secs: plan.recommendation.split.rest_time_secs.min,
        rest_after_exercise_secs: 180,
        updated_at: ts,
      }
      await db.template_exercises.add(te)
      enqueueMutation({ tableName: "template_exercises", recordId: teId, operation: "insert", payload: te })
    }
  }
}

function GradeCard({ plan }: { plan: GradedPlan }) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const c = GRADE_COLORS[plan.grade]
  const split = plan.recommendation.split

  const handleSave = useCallback(async () => {
    setSaving(true)
    await savePlanAsTemplates(plan, plan.title.split(" — ")[0])
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      router.push("/templates")
    }, 800)
  }, [plan, router])

  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} overflow-hidden`}>
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.badge}`}>{plan.grade}</span>
            <div>
              <p className="font-bold text-sm">{plan.title.split(" — ")[1]}</p>
              <p className="text-xs text-[#a0a0a0]">{split.label} · {split.days_per_week}d/wk</p>
            </div>
          </div>
          <span className="text-xs text-[#555] shrink-0 mt-0.5">{expanded ? "▲" : "▼"}</span>
        </div>

        <p className="text-xs text-[#a0a0a0] mt-2">{plan.description}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-[#666]">
          <span>Reps {split.rep_range.min}–{split.rep_range.max}</span>
          <span>Rest {split.rest_time_secs.min}–{split.rest_time_secs.max}s</span>
          <span>{split.sets_per_exercise.min}–{split.sets_per_exercise.max} sets</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#2a2a2a] px-4 pb-4 pt-3 space-y-4">
          {/* Day breakdown */}
          {plan.planDays.filter((d) => d.exercises.length > 0).map((day, i) => (
            <div key={i}>
              <p className="text-xs font-bold text-[#a0a0a0] mb-1.5">{day.label}</p>
              <div className="space-y-1">
                {day.exercises.map((rec, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <p className="text-xs text-[#e0e0e0]">{rec.exercise.name}</p>
                    <p className="text-[10px] text-[#555]">
                      {rec.target_sets}×{rec.target_reps_min}–{rec.target_reps_max}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Tips */}
          {plan.recommendation.tips.slice(0, 3).map((tip, i) => (
            <p key={i} className="text-xs text-[#555] border-l border-[#333] pl-2">{tip}</p>
          ))}

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`w-full rounded-lg py-2.5 text-sm font-bold transition-colors ${
              saved
                ? "bg-[#22c55e] text-white"
                : `${c.badge} opacity-90 hover:opacity-100 disabled:opacity-50`
            }`}
          >
            {saved ? "Saved! Redirecting..." : saving ? "Saving..." : "Save as Program →"}
          </button>
        </div>
      )}
    </div>
  )
}

export default function RecommendationsPage() {
  const { gradedPlans, loading } = useRecommendations()
  const { profile } = useUserProfile()

  if (loading) {
    return <div className="text-center py-12 text-[#a0a0a0] text-sm">Loading...</div>
  }

  if (!profile) {
    return (
      <div className="space-y-4 text-center py-12">
        <h1 className="text-xl font-bold">Plan</h1>
        <p className="text-[#a0a0a0] text-sm">Set up your profile to get personalised plans.</p>
        <Link href="/profile/settings" className="inline-block rounded-lg bg-[#4f9cf7] px-4 py-2 text-sm font-bold text-white">
          Set up Profile
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Plan</h1>
        <Link href="/profile/settings" className="text-xs text-[#555] hover:text-[#a0a0a0] transition-colors">
          {profile.goal} · {profile.experience} →
        </Link>
      </div>

      <p className="text-xs text-[#666]">
        Three plan tiers based on your profile. Tap to expand, then save to Programs.
      </p>

      <div className="space-y-3">
        {gradedPlans.map((plan) => (
          <GradeCard key={plan.grade} plan={plan} />
        ))}
      </div>

      {gradedPlans.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[#a0a0a0] text-sm">No exercises seeded yet.</p>
          <p className="text-xs text-[#555] mt-1">Restart the app to load exercises.</p>
        </div>
      )}
    </div>
  )
}
