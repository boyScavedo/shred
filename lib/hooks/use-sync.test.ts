import "fake-indexeddb/auto"
import { renderHook, act, waitFor } from "@testing-library/react"
import { db } from "@/lib/db"
import { useSyncStatus, useSyncOnMount } from "./use-sync"

beforeEach(async () => {
  await db.sync_queue.clear()
})

afterAll(() => {
  db.close()
})

describe("useSyncStatus", () => {
  it("returns default state", () => {
    const { result } = renderHook(() => useSyncStatus())
    expect(result.current.isSyncing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.lastSyncedAt).toBe("string")
  })
})

describe("useSyncOnMount", () => {
  it("processes queue on mount", async () => {
    const onResult = jest.fn()

    renderHook(() => useSyncOnMount({ onResult }))

    await waitFor(() => {
      expect(onResult).toHaveBeenCalled()
    })
  })
})
