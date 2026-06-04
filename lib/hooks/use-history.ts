"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/db"
import type { WorkoutSession } from "@/types"

export function useCompletedSessions(): WorkoutSession[] {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])

  useEffect(() => {
    async function load() {
      const all = await db.workout_sessions
        .filter((s) => s.completed_at !== null)
        .toArray()

      all.sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      )

      setSessions(all)
    }

    load()
  }, [])

  return sessions
}
