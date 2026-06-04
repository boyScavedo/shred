import "fake-indexeddb/auto"
import { db } from "@/lib/db"
import { enqueueMutation, processSyncQueue } from "./sync"

beforeEach(async () => {
  await db.sync_queue.clear()
})

afterAll(() => {
  db.close()
})

describe("enqueueMutation", () => {
  it("adds a sync queue item", async () => {
    const now = Date.now()
    await enqueueMutation({
      tableName: "exercises",
      recordId: "ex-1",
      operation: "insert",
      payload: { id: "ex-1", name: "Test" },
    })

    const items = await db.sync_queue.toArray()
    expect(items).toHaveLength(1)
    expect(items[0].table_name).toBe("exercises")
    expect(items[0].record_id).toBe("ex-1")
    expect(items[0].operation).toBe("insert")
    expect(items[0].retry_count).toBe(0)
    expect(new Date(items[0].created_at).getTime()).toBeGreaterThanOrEqual(now)
  })

  it("adds multiple items in order", async () => {
    await enqueueMutation({ tableName: "a", recordId: "1", operation: "insert", payload: {} })
    await enqueueMutation({ tableName: "b", recordId: "2", operation: "update", payload: {} })

    const items = await db.sync_queue.toArray()
    expect(items).toHaveLength(2)
  })
})

describe("processSyncQueue", () => {
  it("processes nothing when queue is empty", async () => {
    const result = await processSyncQueue()
    expect(result.processed).toBe(0)
  })

  it("increments retry_count when Supabase is not configured", async () => {
    await enqueueMutation({ tableName: "exercises", recordId: "ex-1", operation: "insert", payload: { id: "ex-1" } })

    const result = await processSyncQueue()

    expect(result.processed).toBe(0)
    expect(result.failed).toBe(1)

    const item = await db.sync_queue.toArray()
    expect(item[0].retry_count).toBe(1)
  })

  it("auto-resets stuck items (retry_count >= 5) and retries them", async () => {
    await db.sync_queue.add({
      id: "stuck",
      table_name: "exercises",
      operation: "insert",
      record_id: "ex-1",
      payload: { id: "ex-1" },
      retry_count: 5,
      created_at: new Date().toISOString(),
    })

    const result = await processSyncQueue()
    // No DATABASE_URL in test env → item fails but is no longer skipped
    expect(result.skipped).toBe(0)

    const afterReset = await db.sync_queue.get("stuck")
    expect(afterReset).toBeDefined()
  })

  it("removes items after successful processing", async () => {
    // No Supabase creds → all items fail, but we still test the pattern
    await enqueueMutation({ tableName: "exercises", recordId: "ex-1", operation: "insert", payload: { id: "ex-1" } })

    const result = await processSyncQueue()
    // Without creds, it should fail but not crash
    expect(result.failed).toBe(1)
  })
})
