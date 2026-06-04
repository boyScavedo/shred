"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/db"
import type { WorkoutSession } from "@/types"

export interface WorkoutStats {
  weeklyWorkoutCount: number
  weeklyVolume: number
  currentStreak: number
  recentSessions: WorkoutSession[]
}

function getDateStr(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function computeStreak(sessions: WorkoutSession[]): number {
  const dates = new Set<string>()
  for (const s of sessions) {
    if (s.completed_at) {
      dates.add(getDateStr(new Date(s.completed_at)))
    }
  }

  let streak = 0
  const today = new Date()
  const cursor = new Date(today)

  while (dates.has(getDateStr(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function useWorkoutStats(): WorkoutStats {
  const [stats, setStats] = useState<WorkoutStats>({
    weeklyWorkoutCount: 0,
    weeklyVolume: 0,
    currentStreak: 0,
    recentSessions: [],
  })

  useEffect(() => {
    async function compute() {
      const allSessions = await db.workout_sessions
        .filter((s) => s.completed_at !== null)
        .toArray()

      allSessions.sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      )

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const weekly = allSessions.filter(
        (s) => new Date(s.started_at) >= weekAgo
      )

      const weeklySessionIds = weekly.map((s) => s.id)
      const weeklyExercises = weeklySessionIds.length > 0
        ? await db.workout_exercises
            .where("session_id")
            .anyOf(weeklySessionIds)
            .toArray()
        : []

      let weeklyVolume = 0
      if (weeklyExercises.length > 0) {
        const weIds = weeklyExercises.map((we) => we.id)
        const weeklySets = await db.workout_sets
          .where("workout_exercise_id")
          .anyOf(weIds)
          .toArray()

        for (const set of weeklySets) {
          if (set.is_completed && set.reps && set.weight_kg) {
            weeklyVolume += set.reps * set.weight_kg
          }
        }
      }

      setStats({
        weeklyWorkoutCount: weekly.length,
        weeklyVolume,
        currentStreak: computeStreak(allSessions),
        recentSessions: allSessions.slice(0, 5),
      })
    }

    compute()
  }, [])

  return stats
}
