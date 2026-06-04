"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useActiveWorkout, useStartWorkout, useCompleteWorkout, useWorkoutExercises, useWorkoutSets, useAddExerciseToWorkout, useUpdateSet, useAddSet, useRemoveExerciseFromWorkout } from "@/lib/hooks/use-workout"
import { useExercises, useExercise } from "@/lib/hooks/use-exercises"
import { useProgression } from "@/lib/hooks/use-progression"
import { usePreviousPerformance, usePersonalRecord } from "@/lib/hooks/use-previous-performance"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { ExerciseBlock } from "@/components/exercise-block"
import { RestTimer } from "@/components/rest-timer"
import { formatDuration } from "@/lib/workout-timer"
import type { WorkoutExercise, WorkoutSet } from "@/types"

// Rest duration by goal (seconds)
const REST_BY_GOAL: Record<string, number> = {
  strength:    180,
  hypertrophy: 90,
  endurance:   45,
  general:     90,
}

function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return (
    <span className="text-sm font-bold tabular-nums text-[#4f9cf7]">{formatDuration(elapsed)}</span>
  )
}

function WorkoutExerciseBlock({
  workoutExercise,
  onRemoved,
  onSetCompleted,
}: {
  workoutExercise: WorkoutExercise
  onRemoved: () => void
  onSetCompleted: (set: WorkoutSet) => void
}) {
  const exercise = useExercise(workoutExercise.exercise_id)
  const sets = useWorkoutSets(workoutExercise.id)
  const progression = useProgression(workoutExercise.exercise_id)
  const previousPerformance = usePreviousPerformance(workoutExercise.exercise_id)
  const personalRecord = usePersonalRecord(workoutExercise.exercise_id)
  const { mutate: updateSet } = useUpdateSet()
  const { mutate: addSet } = useAddSet()
  const { mutate: removeExercise } = useRemoveExerciseFromWorkout()

  const handleRemove = useCallback(async () => {
    await removeExercise(workoutExercise.id)
    onRemoved()
  }, [workoutExercise.id, removeExercise, onRemoved])

  if (!exercise) return null

  return (
    <ExerciseBlock
      workoutExercise={workoutExercise}
      exercise={exercise}
      sets={sets}
      progression={progression}
      previousPerformance={previousPerformance}
      personalRecord={personalRecord}
      onUpdateSet={updateSet}
      onAddSet={() => addSet(workoutExercise.id)}
      onRemove={handleRemove}
      onSetCompleted={onSetCompleted}
    />
  )
}

export default function WorkoutPage() {
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [restSeconds, setRestSeconds] = useState<number | null>(null)
  const [addFilter, setAddFilter] = useState("")

  const { session, refresh: refreshSession } = useActiveWorkout()
  const { exercises, refresh: refreshExercises } = useWorkoutExercises(session?.id)
  const allExercises = useExercises()
  const { profile } = useUserProfile()
  const { mutate: startWorkout, isPending: starting } = useStartWorkout()
  const { mutate: completeWorkout, isPending: completing } = useCompleteWorkout()
  const { mutate: addExercise } = useAddExerciseToWorkout()
  const [removalKey, setRemovalKey] = useState(0)

  const defaultRest = profile ? (REST_BY_GOAL[profile.goal] ?? 90) : 90

  const handleStart = async () => {
    await startWorkout()
    refreshSession()
  }

  const handleComplete = async () => {
    if (session) {
      await completeWorkout(session.id)
      setCompleted(true)
    }
  }

  const handleAddExercise = async (exerciseId: string) => {
    if (session) {
      await addExercise({ sessionId: session.id, exerciseId })
      refreshExercises()
      setShowAddExercise(false)
      setAddFilter("")
    }
  }

  const handleExerciseRemoved = useCallback(() => {
    refreshExercises()
    setRemovalKey((k) => k + 1)
  }, [refreshExercises])

  const handleSetCompleted = useCallback((_set: WorkoutSet) => {
    setRestSeconds(defaultRest)
  }, [defaultRest])

  const filteredExercises = allExercises.filter((e) =>
    addFilter === "" ||
    e.name.toLowerCase().includes(addFilter.toLowerCase()) ||
    e.muscle_group_primary.toLowerCase().includes(addFilter.toLowerCase())
  )

  if (completed || session?.completed_at) {
    return (
      <div className="space-y-4 text-center py-12">
        <h1 className="text-xl font-bold">Workout Complete</h1>
        <p className="text-[#a0a0a0] text-sm">Great work. Session logged.</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#4f9cf7] px-6 py-2 font-bold text-white hover:bg-[#3d8ae5] transition-colors"
        >
          Start New Workout
        </button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-4 text-center py-12">
        <h1 className="text-xl font-bold">Workout</h1>
        <p className="text-[#a0a0a0] text-sm">No active workout</p>
        <button
          onClick={handleStart}
          disabled={starting}
          className="rounded-lg bg-[#4f9cf7] px-6 py-2 font-bold text-white hover:bg-[#3d8ae5] transition-colors disabled:opacity-50"
        >
          {starting ? "Starting..." : "Start Workout"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rest timer overlay */}
      {restSeconds !== null && (
        <RestTimer
          defaultSeconds={restSeconds}
          onDismiss={() => setRestSeconds(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-[#a0a0a0]">Workout in Progress</h1>
          <ElapsedTimer startedAt={session.started_at} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRestSeconds(defaultRest)}
            className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] hover:border-[#4f9cf7] hover:text-[#4f9cf7] transition-colors"
          >
            Rest {defaultRest}s
          </button>
          <button
            onClick={handleComplete}
            disabled={completing}
            className="rounded-lg bg-[#22c55e] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#16a34a] transition-colors disabled:opacity-50"
          >
            {completing ? "Saving..." : "Finish"}
          </button>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {exercises.map((we) => (
          <WorkoutExerciseBlock
            key={`${we.id}-${removalKey}`}
            workoutExercise={we}
            onRemoved={handleExerciseRemoved}
            onSetCompleted={handleSetCompleted}
          />
        ))}

        {exercises.length === 0 && (
          <p className="text-[#a0a0a0] text-sm text-center py-4">No exercises added yet</p>
        )}
      </div>

      <button
        onClick={() => setShowAddExercise(true)}
        className="w-full rounded-lg border border-dashed border-[#333] py-2 text-sm text-[#a0a0a0] hover:border-[#4f9cf7] hover:text-[#4f9cf7] transition-colors"
      >
        + Add Exercise
      </button>

      {/* Add exercise modal */}
      {showAddExercise && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={() => { setShowAddExercise(false); setAddFilter("") }}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-[#1a1a1a] max-h-[80vh] flex flex-col pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#2a2a2a]">
              <h2 className="font-bold mb-3">Add Exercise</h2>
              <input
                type="text"
                value={addFilter}
                onChange={(e) => setAddFilter(e.target.value)}
                placeholder="Search exercises..."
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 text-sm focus:border-[#4f9cf7] focus:outline-none"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleAddExercise(ex.id)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#2a2a2a] transition-colors"
                >
                  <span className="text-sm">{ex.name}</span>
                  <span className="text-xs text-[#a0a0a0] ml-2 capitalize">{ex.muscle_group_primary}</span>
                  <span className="text-xs text-[#555] ml-1 capitalize">· {ex.movement_pattern}</span>
                </button>
              ))}
              {filteredExercises.length === 0 && (
                <p className="text-sm text-[#666] text-center py-4">No exercises match</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
