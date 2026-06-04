"use client"

import { useSyncOnMount } from "@/lib/hooks/use-sync"
import { logger } from "@/lib/logger"
import type { SyncResult } from "@/lib/sync"

function handleResult(result: SyncResult | null) {
  if (!result) {
    logger.warn("sync", "sync-on-mount: returned null — check env vars or Supabase connectivity")
    return
  }
  if (result.failed > 0 || result.skipped > 0) {
    logger.warn("sync", `sync-on-mount: processed=${result.processed} failed=${result.failed} skipped=${result.skipped}`)
  } else if (result.processed > 0) {
    logger.info("sync", `sync-on-mount: processed ${result.processed} items ok`)
  }
}

export function SyncOnMount() {
  useSyncOnMount({ onResult: handleResult })
  return null
}
