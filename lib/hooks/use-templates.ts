"use client"

import { useState, useEffect, useCallback } from "react"
import { db } from "@/lib/db"
import { enqueueMutation } from "@/lib/sync"
import type { ExerciseTemplate, TemplateExercise, WorkoutSet } from "@/types"

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function now(): string {
  return new Date().toISOString()
}

export function useTemplates() {
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([])

  useEffect(() => {
    db.exercise_templates
      .toArray()
      .then((results) => {
        results.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setTemplates(results)
      })
  }, [])

  return templates
}

export function useTemplate(id: string | undefined) {
  const [template, setTemplate] = useState<ExerciseTemplate | undefined>()

  useEffect(() => {
    if (!id) {
      setTemplate(undefined)
      return
    }
    db.exercise_templates.get(id).then(setTemplate)
  }, [id])

  return template
}

export function useTemplateExercises(templateId: string | undefined) {
  const [exercises, setExercises] = useState<TemplateExercise[]>([])

  useEffect(() => {
    if (!templateId) {
      setExercises([])
      return
    }
    db.template_exercises
      .where("template_id")
      .equals(templateId)
      .toArray()
      .then((results) => {
        results.sort((a, b) => a.sort_order - b.sort_order)
        setExercises(results)
      })
  }, [templateId])

  return exercises
}

export function useCreateTemplate() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (data: { name: string; description?: string }) => {
    setIsPending(true)
    const id = uid()
    const ts = now()
    const template: ExerciseTemplate = {
      id,
      name: data.name,
      description: data.description ?? null,
      created_at: ts,
      updated_at: ts,
    }
    await db.exercise_templates.add(template)
    enqueueMutation({ tableName: "exercise_templates", recordId: id, operation: "insert", payload: template })
    setIsPending(false)
    return id
  }, [])

  return { mutate, isPending }
}

export function useUpdateTemplate() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (changes: Partial<ExerciseTemplate> & { id: string }) => {
    setIsPending(true)
    const { id, ...rest } = changes
    const existing = await db.exercise_templates.get(id)
    await db.exercise_templates.update(id, { ...rest, updated_at: now() })
    if (existing) {
      enqueueMutation({ tableName: "exercise_templates", recordId: id, operation: "update", payload: { ...existing, ...rest, updated_at: now() } })
    }
    setIsPending(false)
  }, [])

  return { mutate, isPending }
}

export function useDeleteTemplate() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (id: string) => {
    setIsPending(true)
    const tes = await db.template_exercises.where("template_id").equals(id).toArray()
    for (const te of tes) {
      enqueueMutation({ tableName: "template_exercises", recordId: te.id, operation: "delete", payload: { id: te.id } })
    }
    await db.template_exercises.where("template_id").equals(id).delete()
    await db.exercise_templates.delete(id)
    enqueueMutation({ tableName: "exercise_templates", recordId: id, operation: "delete", payload: { id } })
    setIsPending(false)
  }, [])

  return { mutate, isPending }
}

export function useAddTemplateExercise() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async ({ templateId, exerciseId }: { templateId: string; exerciseId: string }) => {
    setIsPending(true)
    const existing = await db.template_exercises
      .where("template_id")
      .equals(templateId)
      .toArray()

    const maxOrder = existing.reduce((max, te) => Math.max(max, te.sort_order), 0)

    const id = uid()
    const ts = now()
    const te: TemplateExercise = {
      id,
      template_id: templateId,
      exercise_id: exerciseId,
      sort_order: maxOrder + 1,
      target_sets: 3,
      target_reps_min: null,
      target_reps_max: null,
      target_weight_kg: null,
      rest_secs: 90,
      rest_after_exercise_secs: 180,
      updated_at: ts,
    }
    await db.template_exercises.add(te)
    enqueueMutation({ tableName: "template_exercises", recordId: id, operation: "insert", payload: te })
    setIsPending(false)
    return id
  }, [])

  return { mutate, isPending }
}

export function useRemoveTemplateExercise() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (id: string) => {
    setIsPending(true)
    await db.template_exercises.delete(id)
    enqueueMutation({ tableName: "template_exercises", recordId: id, operation: "delete", payload: { id } })
    setIsPending(false)
  }, [])

  return { mutate, isPending }
}

export function useUpdateTemplateExercise() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (changes: Partial<TemplateExercise> & { id: string }) => {
    setIsPending(true)
    const { id, ...rest } = changes
    const existing = await db.template_exercises.get(id)
    await db.template_exercises.update(id, { ...rest, updated_at: now() })
    if (existing) {
      enqueueMutation({ tableName: "template_exercises", recordId: id, operation: "update", payload: { ...existing, ...rest, updated_at: now() } })
    }
    setIsPending(false)
  }, [])

  return { mutate, isPending }
}

export function useStartWorkoutFromTemplate() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (templateId: string) => {
    setIsPending(true)

    const template = await db.exercise_templates.get(templateId)
    if (!template) {
      setIsPending(false)
      throw new Error("Template not found")
    }

    const templateExercises = await db.template_exercises
      .where("template_id")
      .equals(templateId)
      .sortBy("sort_order")

    const ts = now()
    const sessionId = uid()
    const session = {
      id: sessionId,
      started_at: ts,
      completed_at: null,
      duration_secs: null,
      pre_workout_calories: null,
      calories_burned_estimate: null,
      notes: null,
      updated_at: ts,
    }
    await db.workout_sessions.add(session)
    enqueueMutation({ tableName: "workout_sessions", recordId: sessionId, operation: "insert", payload: session })

    for (let i = 0; i < templateExercises.length; i++) {
      const te = templateExercises[i]
      const workoutExerciseId = uid()
      const workoutExercise = {
        id: workoutExerciseId,
        session_id: sessionId,
        exercise_id: te.exercise_id,
        sort_order: i + 1,
        notes: null,
        updated_at: ts,
      }
      await db.workout_exercises.add(workoutExercise)
      enqueueMutation({ tableName: "workout_exercises", recordId: workoutExerciseId, operation: "insert", payload: workoutExercise })

      const sets: WorkoutSet[] = []
      for (let s = 1; s <= te.target_sets; s++) {
        const setId = uid()
        sets.push({
          id: setId,
          workout_exercise_id: workoutExerciseId,
          set_number: s,
          reps: null,
          weight_kg: null,
          duration_secs: null,
          rpe: null,
          set_type: "normal",
          is_completed: false,
          updated_at: ts,
        } as WorkoutSet)
      }
      await db.workout_sets.bulkAdd(sets)
      for (const s of sets) {
        enqueueMutation({ tableName: "workout_sets", recordId: s.id, operation: "insert", payload: s })
      }
    }

    setIsPending(false)
    return sessionId
  }, [])

  return { mutate, isPending }
}
