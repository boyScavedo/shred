"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/db"
import { evaluateProgression } from "@/lib/progression"
import type { ProgressiveOverloadDecision } from "@/types"

export function useProgression(exerciseId: string | undefined) {
  const [decision, setDecision] = useState<ProgressiveOverloadDecision | undefined>()

  useEffect(() => {
    if (!exerciseId) {
      setDecision(undefined)
      return
    }
    const id: string = exerciseId

    async function compute() {
      const exercise = await db.exercises.get(id)
      if (!exercise) {
        setDecision(undefined)
        return
      }

      const weList = await db.workout_exercises
        .where("exercise_id")
        .equals(id)
        .toArray()

      if (weList.length === 0) {
        setDecision(evaluateProgression({ exercise, completedSets: [] }))
        return
      }

      const sessions = await db.workout_sessions
        .where("id")
        .anyOf(...weList.map((we) => we.session_id))
        .filter((s) => s.completed_at != null)
        .toArray()

      if (sessions.length === 0) {
        setDecision(evaluateProgression({ exercise, completedSets: [] }))
        return
      }

      sessions.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      const latest = sessions[0]
      const latestWe = weList.find((we) => we.session_id === latest.id)
      if (!latestWe) {
        setDecision(evaluateProgression({ exercise, completedSets: [] }))
        return
      }

      const sets = await db.workout_sets
        .where("workout_exercise_id")
        .equals(latestWe.id)
        .toArray()

      let bodyweightChain = undefined
      if (exercise.bodyweight_progression_id) {
        bodyweightChain = await db.bodyweight_progressions
          .filter((bp) => bp.id.startsWith(exercise.bodyweight_progression_id!))
          .toArray()
      }

      setDecision(evaluateProgression({
        exercise,
        completedSets: sets,
        bodyweightChain,
      }))
    }

    compute()
  }, [exerciseId])

  return decision
}
