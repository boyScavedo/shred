"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { useTemplate, useTemplateExercises } from "@/lib/hooks/use-templates"
import { useExercises } from "@/lib/hooks/use-exercises"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { analyzePlan } from "@/lib/plan-analyzer"
import type { PlanAnalysis, IssueSeverity } from "@/lib/plan-analyzer"
import type { MuscleGroup } from "@/types"

const GRADE_COLORS: Record<string, string> = {
  A: "text-[#22c55e]",
  B: "text-[#4f9cf7]",
  C: "text-[#f59e0b]",
  D: "text-[#f97316]",
  F: "text-[#ef4444]",
}

const GRADE_BG: Record<string, string> = {
  A: "bg-[#22c55e]/10 border-[#22c55e]/30",
  B: "bg-[#4f9cf7]/10 border-[#4f9cf7]/30",
  C: "bg-[#f59e0b]/10 border-[#f59e0b]/30",
  D: "bg-[#f97316]/10 border-[#f97316]/30",
  F: "bg-[#ef4444]/10 border-[#ef4444]/30",
}

const SEVERITY_ICON: Record<IssueSeverity, string> = {
  error:   "✕",
  warning: "⚠",
  tip:     "→",
}

const SEVERITY_COLOR: Record<IssueSeverity, string> = {
  error:   "text-[#ef4444]",
  warning: "text-[#f59e0b]",
  tip:     "text-[#4f9cf7]",
}

function ScoreRing({ score }: { score: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 85 ? "#22c55e" : score >= 70 ? "#4f9cf7" : score >= 55 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444"

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#2a2a2a" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="46" textAnchor="middle" fill={color} fontSize="20" fontWeight="bold" fontFamily="inherit">
        {score}
      </text>
      <text x="50" y="60" textAnchor="middle" fill="#666" fontSize="9" fontFamily="inherit">
        / 100
      </text>
    </svg>
  )
}

function VolumeBar({ group, sets, target }: { group: string; sets: number; target: number }) {
  const pct = Math.min(100, Math.round((sets / target) * 100))
  const color = pct >= 100 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444"
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="capitalize text-[#a0a0a0]">{group}</span>
        <span style={{ color }}>{sets} sets/wk</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#2a2a2a]">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function AnalyzePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const template = useTemplate(id)
  const templateExercises = useTemplateExercises(id)
  const exercises = useExercises()
  const { profile } = useUserProfile()
  const [analysis, setAnalysis] = useState<PlanAnalysis | null>(null)

  useEffect(() => {
    if (!profile || templateExercises.length === 0 || exercises.length === 0) return
    const result = analyzePlan({
      templateExercises,
      exercises,
      profile: {
        goal: profile.goal,
        body_goal: profile.body_goal,
        experience: profile.experience,
        days_per_week: profile.days_per_week,
      },
    })
    setAnalysis(result)
  }, [profile, templateExercises, exercises])

  if (!template) {
    return <div className="text-center py-12 text-[#a0a0a0] text-sm">Template not found</div>
  }

  if (!profile) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-[#a0a0a0] text-sm">Profile needed to analyze your plan.</p>
        <Link href="/profile" className="inline-block rounded-lg bg-[#4f9cf7] px-6 py-2 text-sm font-bold text-white">
          Set Up Profile
        </Link>
      </div>
    )
  }

  if (!analysis) {
    return <div className="text-center py-12 text-[#a0a0a0] text-sm">Analyzing...</div>
  }

  const targetSets = profile.goal === "strength" ? 12
    : profile.goal === "hypertrophy" ? 17
    : profile.goal === "endurance" ? 22
    : 14

  const muscleEntries = Object.entries(analysis.volume_by_muscle) as [MuscleGroup, number][]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/templates/${id}`} className="text-[#a0a0a0] text-sm hover:text-[#e0e0e0]">←</Link>
        <div>
          <h1 className="text-xl font-bold">Plan Analysis</h1>
          <p className="text-xs text-[#a0a0a0]">{template.name}</p>
        </div>
      </div>

      {/* Score card */}
      <div className={`rounded-lg border p-4 flex items-center gap-4 ${GRADE_BG[analysis.grade]}`}>
        <ScoreRing score={analysis.score} />
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${GRADE_COLORS[analysis.grade]}`}>{analysis.grade}</span>
            <span className="text-sm text-[#a0a0a0]">Grade</span>
          </div>
          <div className="mt-2 space-y-1 text-xs text-[#a0a0a0]">
            <div className="flex justify-between">
              <span>Goal alignment</span>
              <span className="text-[#e0e0e0] font-bold">{analysis.goal_alignment}%</span>
            </div>
            <div className="flex justify-between">
              <span>Push:Pull ratio</span>
              <span className={`font-bold ${analysis.push_pull_ratio <= 1.2 ? "text-[#22c55e]" : "text-[#f59e0b]"}`}>
                {analysis.push_pull_ratio === 0 ? "—" : `${analysis.push_pull_ratio.toFixed(1)}:1`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Compound %</span>
              <span className="text-[#e0e0e0] font-bold">{Math.round(analysis.compound_ratio * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Avg rep range</span>
              <span className="text-[#e0e0e0] font-bold">{analysis.avg_rep_range_min}–{analysis.avg_rep_range_max}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2">Issues Found</p>
          <div className="space-y-2">
            {analysis.issues.map((issue, i) => (
              <div key={i} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-3">
                <div className="flex items-start gap-2">
                  <span className={`text-sm font-bold shrink-0 ${SEVERITY_COLOR[issue.severity]}`}>
                    {SEVERITY_ICON[issue.severity]}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#e0e0e0]">{issue.message}</p>
                    <p className="text-xs text-[#a0a0a0] mt-0.5">{issue.suggestion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volume by muscle */}
      {muscleEntries.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2">Weekly Volume by Muscle</p>
          <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-3 space-y-3">
            {muscleEntries
              .sort((a, b) => b[1] - a[1])
              .map(([group, sets]) => (
                <VolumeBar key={group} group={group} sets={sets} target={targetSets} />
              ))}
            <p className="text-[10px] text-[#444] text-right">Target: {targetSets} sets/week for {profile.goal}</p>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2">Suggestions</p>
          <div className="space-y-2">
            {analysis.suggestions.map((s, i) => (
              <div key={i} className="rounded-lg border border-[#4f9cf7]/20 bg-[#4f9cf7]/5 p-3">
                <p className="text-xs text-[#a0a0a0]">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.issues.length === 0 && (
        <div className="rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/5 p-4 text-center">
          <p className="text-sm font-bold text-[#22c55e]">Excellent plan!</p>
          <p className="text-xs text-[#a0a0a0] mt-1">No major issues detected. Keep training consistently.</p>
        </div>
      )}

      <Link
        href={`/templates/${id}`}
        className="block text-center text-xs text-[#4f9cf7] hover:text-[#3d8ae5] py-2"
      >
        ← Back to template
      </Link>
    </div>
  )
}
