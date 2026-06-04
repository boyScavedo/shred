"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/db"
import { useCompletedSessions } from "@/lib/hooks/use-history"
import type { WorkoutSet } from "@/types"

interface SessionDetailData {
  exerciseName: string
  sets: WorkoutSet[]
}

function SessionCard({ session }: { session: { id: string; started_at: string; duration_secs: number | null } }) {
  const [expanded, setExpanded] = useState(false)
  const [details, setDetails] = useState<SessionDetailData[]>([])

  useEffect(() => {
    if (!expanded) return

    async function loadDetails() {
      const exercises = await db.workout_exercises
        .where("session_id")
        .equals(session.id)
        .sortBy("sort_order")

      const result: SessionDetailData[] = []
      for (const we of exercises) {
        const exercise = await db.exercises.get(we.exercise_id)
        const sets = await db.workout_sets
          .where("workout_exercise_id")
          .equals(we.id)
          .sortBy("set_number")

        result.push({
          exerciseName: exercise?.name ?? we.exercise_id,
          sets,
        })
      }

      setDetails(result)
    }

    loadDetails()
  }, [expanded, session.id])

  return (
    <div
      className="rounded-lg bg-[#1a1a1a] p-3 space-y-2 cursor-pointer active:bg-[#222] transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">
            {new Date(session.started_at).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="text-xs text-[#a0a0a0]">
            {session.duration_secs ? `${Math.round(session.duration_secs / 60)} min` : "—"}
          </p>
        </div>
        <span className="text-xs text-[#555]">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && details.length === 0 && (
        <p className="text-xs text-[#666] py-2">Loading...</p>
      )}

      {expanded && details.map((ex, i) => (
        <div key={i} className="border-t border-[#2a2a2a] pt-2 space-y-1">
          <p className="text-xs font-bold text-[#e0e0e0]">{ex.exerciseName}</p>
          <div className="space-y-0.5">
            {ex.sets.map((set) => (
              <div key={set.id} className="flex items-center gap-2 text-xs text-[#a0a0a0]">
                <span className="text-[#666] w-4">{set.set_number}.</span>
                <span>{set.reps !== null ? `${set.reps} reps` : set.duration_secs !== null ? `${set.duration_secs}s` : "—"}</span>
                {set.weight_kg !== null && <span>@{set.weight_kg}kg</span>}
                {set.rpe !== null && <span>RPE {set.rpe}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HistoryPage() {
  const sessions = useCompletedSessions()

  if (sessions.length === 0) {
    return (
      <div className="space-y-4 text-center py-12">
        <h1 className="text-xl font-bold">History</h1>
        <p className="text-[#a0a0a0] text-sm">No completed workouts yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">History</h1>
      <div className="space-y-2">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}
      </div>
    </div>
  )
}
