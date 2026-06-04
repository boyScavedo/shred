import "fake-indexeddb/auto"
import { renderHook, waitFor } from "@testing-library/react"
import { db } from "@/lib/db"
import { useSeedExercises } from "./use-seed"
import { SEED_EXERCISES, SEED_PROGRESSIONS } from "@/data/seed-exercises"

beforeEach(async () => {
  await db.exercises.clear()
  await db.bodyweight_progressions.clear()
})

afterAll(() => {
  db.close()
})

describe("useSeedExercises", () => {
  it("seeds exercises when table is empty", async () => {
    const { result } = renderHook(() => useSeedExercises())

    await waitFor(() => expect(result.current.seeded).toBe(true))

    const count = await db.exercises.count()
    expect(count).toBe(SEED_EXERCISES.length)
  })

  it("seeds bodyweight progressions when table is empty", async () => {
    const { result } = renderHook(() => useSeedExercises())

    await waitFor(() => expect(result.current.seeded).toBe(true))

    const count = await db.bodyweight_progressions.count()
    expect(count).toBe(SEED_PROGRESSIONS.length)
  })

  it("does nothing when exercises already exist", async () => {
    await db.exercises.bulkAdd([SEED_EXERCISES[0]])

    const { result } = renderHook(() => useSeedExercises())

    await waitFor(() => expect(result.current.seeded).toBe(true))

    const count = await db.exercises.count()
    expect(count).toBe(1)
  })

  it("sets isSeeding true during seed and false after", async () => {
    const { result } = renderHook(() => useSeedExercises())

    expect(result.current.isSeeding).toBe(true)

    await waitFor(() => {
      expect(result.current.isSeeding).toBe(false)
      expect(result.current.seeded).toBe(true)
    })
  })
})
