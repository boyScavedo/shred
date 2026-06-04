"use client"

import { useState, useEffect, useCallback } from "react"
import { db } from "@/lib/db"
import { enqueueMutation } from "@/lib/sync"
import type { Exercise, MuscleGroup, MovementPattern } from "@/types"

function now(): string {
  return new Date().toISOString()
}

interface ExerciseFilters {
  muscleGroup?: MuscleGroup
  movementPattern?: MovementPattern
  search?: string
}

export function useExercises(filters?: ExerciseFilters) {
  const [exercises, setExercises] = useState<Exercise[]>([])

  useEffect(() => {
    let collection = db.exercises.toCollection()

    if (filters?.muscleGroup) {
      collection = db.exercises
        .where("muscle_group_primary")
        .equals(filters.muscleGroup)
    }

    if (filters?.movementPattern) {
      collection = db.exercises
        .where("movement_pattern")
        .equals(filters.movementPattern)
    }

    collection.toArray().then((results) => {
      let filtered = results

      if (filters?.search) {
        const q = filters.search.toLowerCase()
        filtered = filtered.filter((ex) => ex.name.toLowerCase().includes(q))
      }

      setExercises(filtered)
    })
  }, [filters?.muscleGroup, filters?.movementPattern, filters?.search])

  return exercises
}

export function useExercise(id: string | undefined) {
  const [exercise, setExercise] = useState<Exercise | undefined>()

  useEffect(() => {
    if (!id) {
      setExercise(undefined)
      return
    }
    db.exercises.get(id).then(setExercise)
  }, [id])

  return exercise
}

export function useAddExercise() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (exercise: Exercise) => {
    setIsPending(true)
    const record = { ...exercise, updated_at: exercise.updated_at ?? now() }
    await db.exercises.add(record)
    enqueueMutation({ tableName: "exercises", recordId: exercise.id, operation: "insert", payload: record })
    setIsPending(false)
    return exercise.id
  }, [])

  return { mutate, isPending }
}

export function useUpdateExercise() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (changes: Partial<Exercise> & { id: string }) => {
    setIsPending(true)
    const { id, ...rest } = changes
    const existing = await db.exercises.get(id)
    await db.exercises.update(id, { ...rest, updated_at: now() })
    if (existing) {
      enqueueMutation({ tableName: "exercises", recordId: id, operation: "update", payload: { ...existing, ...rest, updated_at: now() } })
    }
    setIsPending(false)
  }, [])

  return { mutate, isPending }
}

export function useDeleteExercise() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (id: string) => {
    setIsPending(true)
    await db.exercises.delete(id)
    enqueueMutation({ tableName: "exercises", recordId: id, operation: "delete", payload: { id } })
    setIsPending(false)
  }, [])

  return { mutate, isPending }
}
