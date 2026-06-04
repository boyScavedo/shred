"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { logout } from "@/lib/auth"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import type { WorkoutSet } from "@/types"

interface LifetimeStats {
  totalWorkouts: number
  totalTimeSecs: number
  totalVolume: number
  currentStreak: number
  weeklyWorkouts: number
}

interface SessionDetail {
  id: string
  started_at: string
  duration_secs: number | null
  exerciseCount: number
}

function getDateStr(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function useProfileData() {
  const [stats, setStats] = useState<LifetimeStats>({
    totalWorkouts: 0,
    totalTimeSecs: 0,
    totalVolume: 0,
    currentStreak: 0,
    weeklyWorkouts: 0,
  })
  const [sessions, setSessions] = useState<SessionDetail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function compute() {
      const allSessions = await db.workout_sessions
        .filter((s) => s.completed_at !== null)
        .toArray()

      allSessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weeklyWorkouts = allSessions.filter((s) => new Date(s.started_at) >= weekAgo).length

      const totalTimeSecs = allSessions.reduce((sum, s) => sum + (s.duration_secs ?? 0), 0)

      const allSets: WorkoutSet[] = await db.workout_sets.toArray()
      const totalVolume = allSets.reduce((sum, s) => {
        if (s.is_completed && s.reps && s.weight_kg) return sum + s.reps * s.weight_kg
        return sum
      }, 0)

      const dates = new Set<string>()
      for (const s of allSessions) {
        if (s.completed_at) dates.add(getDateStr(new Date(s.completed_at)))
      }
      let streak = 0
      const cursor = new Date()
      while (dates.has(getDateStr(cursor))) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      }

      const sessionDetails: SessionDetail[] = await Promise.all(
        allSessions.slice(0, 20).map(async (s) => {
          const exCount = await db.workout_exercises.where("session_id").equals(s.id).count()
          return { id: s.id, started_at: s.started_at, duration_secs: s.duration_secs, exerciseCount: exCount }
        })
      )

      setStats({ totalWorkouts: allSessions.length, totalTimeSecs, totalVolume, currentStreak: streak, weeklyWorkouts })
      setSessions(sessionDetails)
      setLoading(false)
    }

    compute()
  }, [])

  return { stats, sessions, loading }
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-[#1a1a1a] p-2 sm:p-3 text-center min-w-0">
      <p className="text-[10px] text-[#666] uppercase tracking-wider mb-0.5 truncate">{label}</p>
      <p className="text-base sm:text-xl font-bold text-[#e0e0e0] truncate">{value}</p>
      {sub && <p className="text-[10px] text-[#555] mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

function formatHours(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${Math.round(kg)}kg`
}

function SessionRow({ session }: { session: SessionDetail }) {
  const [expanded, setExpanded] = useState(false)
  const [exercises, setExercises] = useState<string[]>([])

  useEffect(() => {
    if (!expanded || exercises.length > 0) return
    async function load() {
      const wes = await db.workout_exercises.where("session_id").equals(session.id).sortBy("sort_order")
      const names: string[] = []
      for (const we of wes) {
        const ex = await db.exercises.get(we.exercise_id)
        if (ex) names.push(ex.name)
      }
      setExercises(names)
    }
    load()
  }, [expanded, session.id, exercises.length])

  return (
    <div
      className="rounded-lg bg-[#1a1a1a] p-3 cursor-pointer active:bg-[#222] transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">
            {new Date(session.started_at).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
            })}
          </p>
          <p className="text-xs text-[#a0a0a0]">
            {session.exerciseCount} exercises
            {session.duration_secs ? ` · ${Math.round(session.duration_secs / 60)}min` : ""}
          </p>
        </div>
        <span className="text-xs text-[#555]">{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-[#2a2a2a] space-y-0.5">
          {exercises.length === 0
            ? <p className="text-xs text-[#555]">Loading...</p>
            : exercises.map((name, i) => (
                <p key={i} className="text-xs text-[#a0a0a0]">· {name}</p>
              ))}
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { profile } = useUserProfile()
  const { stats, sessions, loading } = useProfileData()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  if (loading) {
    return <div className="text-center py-12 text-[#a0a0a0] text-sm">Loading...</div>
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Profile</h1>
        <button onClick={handleLogout} className="text-xs text-[#ef4444] hover:text-[#dc2626] transition-colors">
          Log out
        </button>
      </div>

      {/* Goal summary */}
      {profile && (
        <div className="rounded-lg bg-[#1a1a1a] px-3 py-2 flex items-center justify-between">
          <div className="text-xs text-[#a0a0a0]">
            <span className="capitalize">{profile.goal}</span>
            <span className="text-[#555] mx-1">·</span>
            <span className="capitalize">{profile.body_goal}</span>
            <span className="text-[#555] mx-1">·</span>
            <span>{profile.days_per_week}d/wk</span>
          </div>
          <Link href="/profile/settings" className="text-xs text-[#4f9cf7]">Settings →</Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Workouts" value={String(stats.totalWorkouts)} />
        <StatCard label="Streak" value={`${stats.currentStreak}d`} />
        <StatCard label="This week" value={String(stats.weeklyWorkouts)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total time" value={formatHours(stats.totalTimeSecs)} />
        <StatCard label="Volume" value={formatVolume(stats.totalVolume)} />
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2">Workout History</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-[#555] text-center py-4">No completed workouts yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => <SessionRow key={s.id} session={s} />)}
          </div>
        )}
      </div>
    </div>
  )
}
