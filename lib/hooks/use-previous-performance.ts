"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/db"
import type { WorkoutSet } from "@/types"

export interface PreviousPerformance {
  sets: Pick<WorkoutSet, "set_number" | "reps" | "weight_kg" | "duration_secs" | "rpe">[]
  date: string
}

export function usePreviousPerformance(exerciseId: string | undefined): PreviousPerformance | null {
  const [prev, setPrev] = useState<PreviousPerformance | null>(null)

  useEffect(() => {
    if (!exerciseId) return

    async function load() {
      const completedSessions = await db.workout_sessions
        .filter((s) => s.completed_at !== null)
        .toArray()

      completedSessions.sort(
        (a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
      )

      for (const session of completedSessions) {
        const workoutExercises = await db.workout_exercises
          .where("session_id")
          .equals(session.id)
          .toArray()

        const matching = workoutExercises.find((we) => we.exercise_id === exerciseId)
        if (!matching) continue

        const sets = await db.workout_sets
          .where("workout_exercise_id")
          .equals(matching.id)
          .toArray()

        const completed = sets
          .filter((s) => s.is_completed)
          .sort((a, b) => a.set_number - b.set_number)

        if (completed.length > 0) {
          setPrev({
            sets: completed.map((s) => ({
              set_number: s.set_number,
              reps: s.reps,
              weight_kg: s.weight_kg,
              duration_secs: s.duration_secs,
              rpe: s.rpe,
            })),
            date: session.completed_at!,
          })
          return
        }
      }
      setPrev(null)
    }

    load()
  }, [exerciseId])

  return prev
}

export interface PersonalRecord {
  weight_kg: number
  reps: number
  estimated_1rm: number
  date: string
}

export function usePersonalRecord(exerciseId: string | undefined): PersonalRecord | null {
  const [pr, setPr] = useState<PersonalRecord | null>(null)

  useEffect(() => {
    if (!exerciseId) return

    async function load() {
      const allWorkoutExercises = await db.workout_exercises
        .where("exercise_id")
        .equals(exerciseId!)
        .toArray()

      let best: PersonalRecord | null = null

      for (const we of allWorkoutExercises) {
        const session = await db.workout_sessions.get(we.session_id)
        if (!session?.completed_at) continue

        const sets = await db.workout_sets
          .where("workout_exercise_id")
          .equals(we.id)
          .toArray()

        for (const s of sets) {
          if (!s.is_completed || !s.weight_kg || !s.reps) continue
          const e1rm = Math.round(s.weight_kg * (1 + s.reps / 30))
          if (!best || e1rm > best.estimated_1rm) {
            best = {
              weight_kg: s.weight_kg,
              reps: s.reps,
              estimated_1rm: e1rm,
              date: session.completed_at,
            }
          }
        }
      }

      setPr(best)
    }

    load()
  }, [exerciseId])

  return pr
}
