import "fake-indexeddb/auto"
import { renderHook, waitFor } from "@testing-library/react"
import { db } from "@/lib/db"
import { useWorkoutStats } from "./use-stats"
import type { WorkoutSession, WorkoutSet } from "@/types"

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    duration_secs: 3600,
    pre_workout_calories: null,
    calories_burned_estimate: null,
    notes: null,
    ...overrides,
  }
}

function makeSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    workout_exercise_id: "we-1",
    set_number: 1,
    reps: 10,
    weight_kg: 20,
    duration_secs: null,
    rpe: null,
    set_type: "normal",
    is_completed: true,
    ...overrides,
  }
}

beforeEach(async () => {
  await db.workout_sessions.clear()
  await db.workout_exercises.clear()
  await db.workout_sets.clear()
})

afterAll(() => {
  db.close()
})

describe("useWorkoutStats", () => {
  it("returns zeros and empty list when no sessions", async () => {
    const { result } = renderHook(() => useWorkoutStats())
    await waitFor(() => {
      expect(result.current.weeklyWorkoutCount).toBe(0)
      expect(result.current.weeklyVolume).toBe(0)
      expect(result.current.currentStreak).toBe(0)
      expect(result.current.recentSessions).toEqual([])
    })
  })

  it("counts workouts from the last 7 days", async () => {
    const now = new Date()
    await db.workout_sessions.bulkAdd([
      makeSession({ id: "s-1", started_at: now.toISOString(), completed_at: now.toISOString() }),
      makeSession({ id: "s-2", started_at: now.toISOString(), completed_at: now.toISOString() }),
    ])

    const { result } = renderHook(() => useWorkoutStats())
    await waitFor(() => {
      expect(result.current.weeklyWorkoutCount).toBe(2)
    })
  })

  it("excludes uncompleted sessions from count", async () => {
    await db.workout_sessions.bulkAdd([
      makeSession({ id: "s-1", started_at: new Date().toISOString(), completed_at: new Date().toISOString() }),
      makeSession({ id: "s-2", started_at: new Date().toISOString(), completed_at: null }),
    ])

    const { result } = renderHook(() => useWorkoutStats())
    await waitFor(() => {
      expect(result.current.weeklyWorkoutCount).toBe(1)
    })
  })

  it("excludes sessions older than 7 days from weekly count", async () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 10)

    await db.workout_sessions.bulkAdd([
      makeSession({ id: "s-old", started_at: oldDate.toISOString(), completed_at: oldDate.toISOString() }),
      makeSession({ id: "s-new", started_at: new Date().toISOString(), completed_at: new Date().toISOString() }),
    ])

    const { result } = renderHook(() => useWorkoutStats())
    await waitFor(() => {
      expect(result.current.weeklyWorkoutCount).toBe(1)
    })
  })

  it("returns recent sessions sorted by newest first", async () => {
    const old = new Date()
    old.setDate(old.getDate() - 3)
    const newer = new Date()
    newer.setDate(newer.getDate() - 1)

    await db.workout_sessions.bulkAdd([
      makeSession({ id: "s-older", started_at: old.toISOString(), completed_at: old.toISOString() }),
      makeSession({ id: "s-newer", started_at: newer.toISOString(), completed_at: newer.toISOString() }),
    ])

    const { result } = renderHook(() => useWorkoutStats())
    await waitFor(() => {
      expect(result.current.recentSessions).toHaveLength(2)
      expect(result.current.recentSessions[0].id).toBe("s-newer")
      expect(result.current.recentSessions[1].id).toBe("s-older")
    })
  })

  it("limits recent sessions to 5", async () => {
    const sessions = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return makeSession({ id: `s-${i}`, started_at: d.toISOString(), completed_at: d.toISOString() })
    })
    await db.workout_sessions.bulkAdd(sessions)

    const { result } = renderHook(() => useWorkoutStats())
    await waitFor(() => {
      expect(result.current.recentSessions).toHaveLength(5)
    })
  })

  it("calculates weekly volume from completed sets", async () => {
    const now = new Date()
    await db.workout_sessions.add(makeSession({ id: "s-vol", started_at: now.toISOString(), completed_at: now.toISOString() }))
    await db.workout_exercises.add({ id: "we-vol", session_id: "s-vol", exercise_id: "ex-1", sort_order: 1, notes: null })
    await db.workout_sets.bulkAdd([
      makeSet({ workout_exercise_id: "we-vol", reps: 10, weight_kg: 20, is_completed: true }),
      makeSet({ workout_exercise_id: "we-vol", reps: 8, weight_kg: 20, is_completed: true }),
    ])

    const { result } = renderHook(() => useWorkoutStats())
    await waitFor(() => {
      expect(result.current.weeklyVolume).toBe(360)
    })
  })

  it("calculates streak of consecutive days", async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    await db.workout_sessions.bulkAdd([
      makeSession({ id: "s-today", started_at: today.toISOString(), completed_at: today.toISOString() }),
      makeSession({ id: "s-yest", started_at: yesterday.toISOString(), completed_at: yesterday.toISOString() }),
      makeSession({ id: "s-2days", started_at: twoDaysAgo.toISOString(), completed_at: twoDaysAgo.toISOString() }),
    ])

    const { result } = renderHook(() => useWorkoutStats())
    await waitFor(() => {
      expect(result.current.currentStreak).toBe(3)
    })
  })

  it("streak breaks when a day is missed", async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    await db.workout_sessions.bulkAdd([
      makeSession({ id: "s-today", started_at: today.toISOString(), completed_at: today.toISOString() }),
      makeSession({ id: "s-3days", started_at: threeDaysAgo.toISOString(), completed_at: threeDaysAgo.toISOString() }),
    ])

    const { result } = renderHook(() => useWorkoutStats())
    await waitFor(() => {
      expect(result.current.currentStreak).toBe(1)
    })
  })
})
