"use client"

import { useState, useEffect, useCallback } from "react"
import { liveQuery } from "dexie"
import { db } from "@/lib/db"
import { enqueueMutation } from "@/lib/sync"
import type { WorkoutSession, WorkoutExercise, WorkoutSet } from "@/types"

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function now(): string {
  return new Date().toISOString()
}

export function useActiveWorkout() {
  const [session, setSession] = useState<WorkoutSession | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    db.workout_sessions
      .filter((s) => s.completed_at === null)
      .first()
      .then(setSession)
  }, [refreshKey])

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  return { session, refresh }
}

export function useStartWorkout() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async () => {
    setIsPending(true)
    const id = uid()
    const session: WorkoutSession = {
      id,
      started_at: now(),
      completed_at: null,
      duration_secs: null,
      pre_workout_calories: null,
      calories_burned_estimate: null,
      notes: null,
      updated_at: now(),
    }
    await db.workout_sessions.add(session)
    enqueueMutation({ tableName: "workout_sessions", recordId: id, operation: "insert", payload: session })
    setIsPending(false)
    return id
  }, [])

  return { mutate, isPending }
}

export function useCompleteWorkout() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (id: string) => {
    setIsPending(true)
    const session = await db.workout_sessions.get(id)
    if (session) {
      const started = new Date(session.started_at).getTime()
      const ts = Date.now()
      const updates = {
        completed_at: new Date().toISOString(),
        duration_secs: Math.round((ts - started) / 1000),
        updated_at: now(),
      }
      await db.workout_sessions.update(id, updates)
      enqueueMutation({ tableName: "workout_sessions", recordId: id, operation: "update", payload: { ...session, ...updates } })
    }
    setIsPending(false)
  }, [])

  return { mutate, isPending }
}

export function useWorkoutExercises(sessionId: string | undefined) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!sessionId) {
      setExercises([])
      return
    }
    db.workout_exercises
      .where("session_id")
      .equals(sessionId)
      .toArray()
      .then((results) => {
        results.sort((a, b) => a.sort_order - b.sort_order)
        setExercises(results)
      })
  }, [sessionId, refreshKey])

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  return { exercises, refresh }
}

export function useWorkoutSets(workoutExerciseId: string | undefined) {
  const [sets, setSets] = useState<WorkoutSet[]>([])

  useEffect(() => {
    if (!workoutExerciseId) {
      setSets([])
      return
    }
    const subscription = liveQuery(() =>
      db.workout_sets.where("workout_exercise_id").equals(workoutExerciseId).toArray()
    ).subscribe({
      next: (results) => setSets([...results].sort((a, b) => a.set_number - b.set_number)),
      error: () => {},
    })
    return () => subscription.unsubscribe()
  }, [workoutExerciseId])

  return sets
}

export function useAddExerciseToWorkout() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async ({ sessionId, exerciseId }: { sessionId: string; exerciseId: string }) => {
    setIsPending(true)
    const existing = await db.workout_exercises
      .where("session_id")
      .equals(sessionId)
      .toArray()

    const maxOrder = existing.reduce((max, we) => Math.max(max, we.sort_order), 0)

    const id = uid()
    const ts = now()
    const workoutExercise: WorkoutExercise = {
      id,
      session_id: sessionId,
      exercise_id: exerciseId,
      sort_order: maxOrder + 1,
      notes: null,
      updated_at: ts,
    }
    await db.workout_exercises.add(workoutExercise)
    enqueueMutation({ tableName: "workout_exercises", recordId: id, operation: "insert", payload: workoutExercise })

    const exercise = await db.exercises.get(exerciseId)
    if (exercise && exercise.default_sets > 0) {
      const sets: WorkoutSet[] = []
      for (let i = 1; i <= exercise.default_sets; i++) {
        const setId = uid()
        sets.push({
          id: setId,
          workout_exercise_id: id,
          set_number: i,
          reps: null,
          weight_kg: null,
          duration_secs: null,
          rpe: null,
          set_type: "normal",
          is_completed: false,
          updated_at: ts,
        })
      }
      await db.workout_sets.bulkAdd(sets)
      for (const s of sets) {
        enqueueMutation({ tableName: "workout_sets", recordId: s.id, operation: "insert", payload: s })
      }
    }

    setIsPending(false)
    return id
  }, [])

  return { mutate, isPending }
}

export function useAddSet() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (workoutExerciseId: string) => {
    setIsPending(true)
    const existing = await db.workout_sets
      .where("workout_exercise_id")
      .equals(workoutExerciseId)
      .toArray()

    const maxSet = existing.reduce((max, s) => Math.max(max, s.set_number), 0)

    const id = uid()
    const ts = now()
    const set: WorkoutSet = {
      id,
      workout_exercise_id: workoutExerciseId,
      set_number: maxSet + 1,
      reps: null,
      weight_kg: null,
      duration_secs: null,
      rpe: null,
      set_type: "normal",
      is_completed: false,
      updated_at: ts,
    }
    await db.workout_sets.add(set)
    enqueueMutation({ tableName: "workout_sets", recordId: id, operation: "insert", payload: set })
    setIsPending(false)
    return id
  }, [])

  return { mutate, isPending }
}

export function useRemoveExerciseFromWorkout() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (id: string) => {
    setIsPending(true)
    const sets = await db.workout_sets.where("workout_exercise_id").equals(id).toArray()
    for (const s of sets) {
      enqueueMutation({ tableName: "workout_sets", recordId: s.id, operation: "delete", payload: { id: s.id } })
    }
    await db.workout_sets.where("workout_exercise_id").equals(id).delete()
    await db.workout_exercises.delete(id)
    enqueueMutation({ tableName: "workout_exercises", recordId: id, operation: "delete", payload: { id } })
    setIsPending(false)
  }, [])

  return { mutate, isPending }
}

export function useUpdateSet() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (set: Partial<WorkoutSet> & { id: string }) => {
    setIsPending(true)
    const ts = now()
    const changes = { ...set, updated_at: ts }
    const existing = await db.workout_sets.get(set.id)
    if (existing) {
      await db.workout_sets.update(set.id, changes)
      enqueueMutation({ tableName: "workout_sets", recordId: set.id, operation: "update", payload: { ...existing, ...changes } })
    } else {
      await db.workout_sets.add(changes as WorkoutSet)
      enqueueMutation({ tableName: "workout_sets", recordId: set.id, operation: "insert", payload: changes })
    }
    setIsPending(false)
  }, [])

  return { mutate, isPending }
}
