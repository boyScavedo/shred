import "fake-indexeddb/auto"
import { renderHook, waitFor } from "@testing-library/react"
import { db } from "@/lib/db"
import { useCompletedSessions } from "./use-history"
import type { WorkoutSession } from "@/types"

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    duration_secs: 1800,
    pre_workout_calories: null,
    calories_burned_estimate: null,
    notes: null,
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

describe("useCompletedSessions", () => {
  it("returns empty array when no sessions exist", async () => {
    const { result } = renderHook(() => useCompletedSessions())
    await waitFor(() => expect(result.current).toEqual([]))
  })

  it("returns completed sessions sorted by newest first", async () => {
    const old = new Date()
    old.setDate(old.getDate() - 3)
    const newer = new Date()
    newer.setDate(newer.getDate() - 1)

    await db.workout_sessions.bulkAdd([
      makeSession({ id: "s-old", started_at: old.toISOString(), completed_at: old.toISOString() }),
      makeSession({ id: "s-new", started_at: newer.toISOString(), completed_at: newer.toISOString() }),
    ])

    const { result } = renderHook(() => useCompletedSessions())
    await waitFor(() => {
      expect(result.current).toHaveLength(2)
      expect(result.current[0].id).toBe("s-new")
      expect(result.current[1].id).toBe("s-old")
    })
  })

  it("excludes uncompleted sessions", async () => {
    await db.workout_sessions.bulkAdd([
      makeSession({ id: "s-complete" }),
      makeSession({ id: "s-incomplete", completed_at: null }),
    ])

    const { result } = renderHook(() => useCompletedSessions())
    await waitFor(() => {
      expect(result.current).toHaveLength(1)
      expect(result.current[0].id).toBe("s-complete")
    })
  })
})
