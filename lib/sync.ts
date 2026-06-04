import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { SyncOperation } from "@/types"

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function now(): string {
  return new Date().toISOString()
}

export interface EnqueueInput {
  tableName: string
  recordId: string
  operation: SyncOperation
  payload: unknown
}

export async function enqueueMutation(input: EnqueueInput): Promise<void> {
  logger.debug("sync", `enqueue ${input.operation} ${input.tableName} id=${input.recordId}`)
  await db.sync_queue.add({
    id: uid(),
    table_name: input.tableName,
    operation: input.operation,
    record_id: input.recordId,
    payload: input.payload,
    retry_count: 0,
    created_at: now(),
  })
}

const MAX_RETRIES = 5

export interface SyncResult {
  processed: number
  failed: number
  skipped: number
}

interface SyncItemPayload {
  id: string
  table_name: string
  operation: string
  record_id: string
  payload: unknown
}

async function callSyncApi(items: SyncItemPayload[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>()
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
    if (!res.ok) {
      logger.error("sync", `api error ${res.status}`)
      items.forEach((i) => results.set(i.id, false))
      return results
    }
    const data = await res.json()
    for (const r of data.results ?? []) {
      results.set(r.id, r.success)
      if (!r.success) {
        logger.error("sync", `failed ${r.id}: ${r.error}`)
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("sync", `fetch error: ${msg}`)
    items.forEach((i) => results.set(i.id, false))
  }
  return results
}

export async function processSyncQueue(): Promise<SyncResult> {
  const items = await db.sync_queue.toArray()
  logger.info("sync", `processing queue: ${items.length} items`)
  let processed = 0
  let failed = 0
  let skipped = 0

  items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const eligible = items.filter((i) => i.retry_count < MAX_RETRIES)
  const stale = items.filter((i) => i.retry_count >= MAX_RETRIES)
  skipped = stale.length

  if (eligible.length === 0) {
    logger.info("sync", `queue done — processed:0 failed:0 skipped:${skipped}`)
    return { processed: 0, failed: 0, skipped }
  }

  const results = await callSyncApi(eligible)

  for (const item of eligible) {
    const success = results.get(item.id) ?? false
    if (success) {
      await db.sync_queue.delete(item.id)
      processed++
    } else {
      await db.sync_queue.update(item.id, { retry_count: item.retry_count + 1 })
      failed++
    }
  }

  logger.info("sync", `queue done — processed:${processed} failed:${failed} skipped:${skipped}`)
  return { processed, failed, skipped }
}

export async function resetSyncQueue(): Promise<number> {
  const items = await db.sync_queue.toArray()
  const stuck = items.filter((i) => i.retry_count >= MAX_RETRIES)
  for (const item of stuck) {
    await db.sync_queue.update(item.id, { retry_count: 0 })
  }
  logger.info("sync", `reset ${stuck.length} stuck items`)
  return stuck.length
}

export async function syncAllLocalToRemote(): Promise<void> {
  const tables: { name: string; getData: () => Promise<unknown[]> }[] = [
    { name: "exercises", getData: () => db.exercises.toArray() },
    { name: "bodyweight_progressions", getData: () => db.bodyweight_progressions.toArray() },
    { name: "workout_sessions", getData: () => db.workout_sessions.toArray() },
    { name: "workout_exercises", getData: () => db.workout_exercises.toArray() },
    { name: "workout_sets", getData: () => db.workout_sets.toArray() },
    { name: "exercise_templates", getData: () => db.exercise_templates.toArray() },
    { name: "template_exercises", getData: () => db.template_exercises.toArray() },
    { name: "user_profile", getData: () => db.user_profile.toArray() },
  ]

  for (const table of tables) {
    const data = await table.getData()
    if (data.length === 0) continue

    const items = (data as Record<string, unknown>[]).map((row) => ({
      id: `bulk-${table.name}-${row.id}`,
      table_name: table.name,
      operation: "insert" as const,
      record_id: String(row.id),
      payload: row,
    }))

    const results = await callSyncApi(items)
    const failed = [...results.values()].filter((v) => !v).length
    if (failed > 0) {
      logger.error("sync", `syncAllLocalToRemote: ${failed} failed for ${table.name}`)
    }
  }
}
