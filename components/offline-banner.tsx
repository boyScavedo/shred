"use client"

import { useState, useEffect } from "react"
import { useSyncQueueSize, useSyncStatus } from "@/lib/hooks/use-sync"

export function OfflineBanner() {
  const [online, setOnline] = useState(true)
  const { size, stuck, refresh } = useSyncQueueSize()
  const { isSyncing, resetAndSync } = useSyncStatus()

  useEffect(() => {
    setOnline(navigator.onLine)
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])

  if (online && size === 0) return null

  const isAllStuck = size > 0 && stuck === size

  const bg = !online ? "bg-[#eab308]" : isAllStuck ? "bg-red-700" : "bg-emerald-600"
  const text = !online ? "text-black" : "text-white"

  const message = !online
    ? "Offline — changes will sync when connected"
    : isAllStuck
      ? `${stuck} changes failed to sync`
      : `${size} ${size === 1 ? "change" : "changes"} pending sync`

  const handleReset = async () => {
    await resetAndSync()
    await refresh()
  }

  return (
    <div className={`${bg} ${text} text-center text-xs p-1 font-bold flex items-center justify-center gap-2`}>
      <span>{message}</span>
      {online && isAllStuck && (
        <button
          onClick={handleReset}
          disabled={isSyncing}
          className="underline opacity-80 hover:opacity-100 disabled:opacity-50"
        >
          {isSyncing ? "Retrying…" : "Retry"}
        </button>
      )}
    </div>
  )
}
