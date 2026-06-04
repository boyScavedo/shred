"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { db } from "@/lib/db"
import { processSyncQueue, resetSyncQueue } from "@/lib/sync"
import { logger } from "@/lib/logger"
import type { SyncResult } from "@/lib/sync"

export interface SyncState {
  isSyncing: boolean
  error: string | null
  lastSyncedAt: string
}

export function useSyncStatus() {
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    error: null,
    lastSyncedAt: new Date(0).toISOString(),
  })

  const sync = useCallback(async () => {
    setState((prev) => ({ ...prev, isSyncing: true, error: null }))
    try {
      const result = await processSyncQueue()
      setState({
        isSyncing: false,
        error: null,
        lastSyncedAt: new Date().toISOString(),
      })
      return result
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sync failed"
      logger.error("sync", "useSyncStatus caught: " + message)
      setState((prev) => ({ ...prev, isSyncing: false, error: message }))
      return null
    }
  }, [])

  const resetAndSync = useCallback(async () => {
    await resetSyncQueue()
    return sync()
  }, [sync])

  return { ...state, sync, resetAndSync }
}

export function useSyncQueueSize() {
  const [size, setSize] = useState(0)
  const [stuck, setStuck] = useState(0)

  const refresh = useCallback(async () => {
    const items = await db.sync_queue.toArray()
    setSize(items.length)
    setStuck(items.filter((i) => (i.retry_count ?? 0) >= 5).length)
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  }, [refresh])

  return { size, stuck, refresh }
}

export function useSyncOnMount({ onResult }: { onResult?: (result: SyncResult | null) => void } = {}) {
  const { sync } = useSyncStatus()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    sync().then((result) => {
      onResult?.(result)
    })
  }, [sync, onResult])
}
