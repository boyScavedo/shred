"use client"

import { useRouter } from "next/navigation"
import { useWorkoutStats } from "@/lib/hooks/use-stats"
import { useActiveWorkout, useStartWorkout } from "@/lib/hooks/use-workout"

export default function DashboardPage() {
  const router = useRouter()
  const stats = useWorkoutStats()
  const { session } = useActiveWorkout()
  const { mutate: startWorkout, isPending: starting } = useStartWorkout()

  const handleStartWorkout = async () => {
    if (session) {
      router.push("/workout")
    } else {
      await startWorkout()
      router.push("/workout")
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>

      <button
        onClick={handleStartWorkout}
        disabled={starting}
        className="w-full rounded-lg bg-[#4f9cf7] py-3 font-bold text-white text-lg hover:bg-[#3d8ae5] transition-colors disabled:opacity-50"
      >
        {starting ? "Starting..." : session ? "Continue Workout" : "Start Workout"}
      </button>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[#1a1a1a] p-2 sm:p-3 text-center min-w-0">
          <p className="text-lg sm:text-2xl font-bold text-[#4f9cf7] truncate">{stats.weeklyWorkoutCount}</p>
          <p className="text-[10px] sm:text-xs text-[#a0a0a0] mt-0.5">This Week</p>
        </div>
        <div className="rounded-lg bg-[#1a1a1a] p-2 sm:p-3 text-center min-w-0">
          <p className="text-lg sm:text-2xl font-bold text-[#22c55e] truncate">{stats.weeklyVolume.toLocaleString()}</p>
          <p className="text-[10px] sm:text-xs text-[#a0a0a0] mt-0.5">Volume</p>
        </div>
        <div className="rounded-lg bg-[#1a1a1a] p-2 sm:p-3 text-center min-w-0">
          <p className="text-lg sm:text-2xl font-bold text-[#f59e0b] truncate">{stats.currentStreak}</p>
          <p className="text-[10px] sm:text-xs text-[#a0a0a0] mt-0.5">Streak</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-[#a0a0a0] mb-2">Recent Sessions</h2>
        {stats.recentSessions.length === 0 ? (
          <p className="text-sm text-[#666] text-center py-8">No workouts yet. Start your first one!</p>
        ) : (
          <div className="space-y-2">
            {stats.recentSessions.map((s) => (
              <div key={s.id} className="rounded-lg bg-[#1a1a1a] p-3">
                <p className="text-sm font-bold">
                  {new Date(s.started_at).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-[#a0a0a0]">
                  {s.duration_secs ? `${Math.round(s.duration_secs / 60)} min` : "In progress"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
