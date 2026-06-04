"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/db"
import { generateWeeklyPlan } from "@/lib/guide"
import type { WeeklyPlanDay } from "@/lib/guide"
import type { MuscleGroup } from "@/types"

export function useGuide() {
  const [plan, setPlan] = useState<WeeklyPlanDay[]>([])

  useEffect(() => {
    async function compute() {
      const exercises = await db.exercises.toArray()

      if (exercises.length === 0) {
        setPlan([])
        return
      }

      const completedSessions = await db.workout_sessions
        .filter((s) => s.completed_at != null)
        .toArray()

      const recentSets: { sessionCompletedAt: string; muscleGroups: MuscleGroup[] }[] = []

      for (const session of completedSessions) {
        const weList = await db.workout_exercises
          .where("session_id")
          .equals(session.id)
          .toArray()

        const muscleGroups = new Set<MuscleGroup>()
        for (const we of weList) {
          const ex = exercises.find((e) => e.id === we.exercise_id)
          if (ex) {
            muscleGroups.add(ex.muscle_group_primary)
            if (ex.muscle_group_secondary) muscleGroups.add(ex.muscle_group_secondary)
          }
        }

        recentSets.push({
          sessionCompletedAt: session.completed_at!,
          muscleGroups: [...muscleGroups],
        })
      }

      const result = generateWeeklyPlan({ exercises, recentSets })
      setPlan(result)
    }

    compute()
  }, [])

  return plan
}
