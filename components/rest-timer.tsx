"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { formatDuration } from "@/lib/workout-timer"

interface RestTimerProps {
  defaultSeconds: number
  onDismiss: () => void
}

export function RestTimer({ defaultSeconds, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(defaultSeconds)
  const [total, setTotal] = useState(defaultSeconds)
  const [running, setRunning] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    if (!running) { clear(); return }

    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clear()
          setRunning(false)
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([200, 100, 200])
          }
          return 0
        }
        return r - 1
      })
    }, 1000)

    return clear
  }, [running])

  const addTime = useCallback((secs: number) => {
    setRemaining((r) => Math.max(0, r + secs))
    setTotal((t) => Math.max(0, t + secs))
    setRunning(true)
  }, [])

  const pct = total > 0 ? ((total - remaining) / total) * 100 : 100
  const done = remaining === 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onDismiss}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-[#1a1a1a] border-t border-[#2a2a2a] p-5 pb-[calc(2rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-1 w-full bg-[#2a2a2a] rounded-full mb-5">
          <div
            className="h-1 rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              backgroundColor: done ? "#22c55e" : "#4f9cf7",
            }}
          />
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs text-[#666] uppercase tracking-wider">
            {done ? "Done" : "Timer"}
          </p>
          <p className={`text-5xl sm:text-6xl font-bold tabular-nums ${done ? "text-[#22c55e]" : "text-[#e0e0e0]"}`}>
            {formatDuration(remaining)}
          </p>
          {!done && (
            <p className="text-xs text-[#444]">Tap outside to dismiss</p>
          )}
        </div>

        <div className="mt-5 space-y-2">
          {!done ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => { setRunning((r) => !r) }}
                  className="rounded-lg border border-[#2a2a2a] py-2.5 text-sm font-bold text-[#e0e0e0] hover:border-[#444] transition-colors min-h-[44px]"
                >
                  {running ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => addTime(-15)}
                  className="rounded-lg border border-[#2a2a2a] py-2.5 text-sm text-[#a0a0a0] hover:border-[#444] transition-colors min-h-[44px]"
                >
                  −15s
                </button>
                <button
                  onClick={() => addTime(15)}
                  className="rounded-lg border border-[#2a2a2a] py-2.5 text-sm text-[#a0a0a0] hover:border-[#444] transition-colors min-h-[44px]"
                >
                  +15s
                </button>
                <button
                  onClick={onDismiss}
                  className="rounded-lg py-2.5 text-sm font-bold text-white bg-[#4f9cf7] hover:bg-[#3d8ae5] transition-colors min-h-[44px]"
                >
                  Skip
                </button>
              </div>
              {/* Quick-set duration */}
              <div className="flex gap-1.5 justify-center">
                {[60, 90, 120, 180, 300].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setRemaining(s); setTotal(s); setRunning(true) }}
                    className="flex-1 text-xs text-[#444] hover:text-[#a0a0a0] transition-colors py-2 min-h-[36px] rounded border border-transparent hover:border-[#333]"
                  >
                    {s < 60 ? `${s}s` : `${s / 60}m`}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <button
              onClick={onDismiss}
              className="w-full rounded-lg py-3 text-sm font-bold text-white bg-[#22c55e] hover:bg-[#16a34a] transition-colors min-h-[44px]"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
