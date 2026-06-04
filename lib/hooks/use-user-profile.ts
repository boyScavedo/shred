"use client"

import { useState, useEffect, useCallback } from "react"
import { liveQuery } from "dexie"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { UserProfile } from "@/types"

function now(): string {
  return new Date().toISOString()
}

const DEFAULT_PROFILE: UserProfile = {
  id: "profile",
  goal: "hypertrophy",
  body_goal: "maintaining",
  experience: "beginner",
  days_per_week: 4,
  equipment: ["bodyweight"],
  bodyweight_kg: null,
  target_bodyweight_kg: null,
  updated_at: now(),
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const subscription = liveQuery(() => db.user_profile.get("profile")).subscribe({
      next: (p) => {
        setProfile(p ?? null)
        setLoading(false)
        if (!p) logger.warn("profile", "no profile found — defaults will be used")
      },
      error: (err) => {
        logger.error("profile", "liveQuery failed", err)
        setLoading(false)
      },
    })
    return () => subscription.unsubscribe()
  }, [])

  return { profile, loading }
}

export function useUpdateUserProfile() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (updates: Partial<Omit<UserProfile, "id">>) => {
    setIsPending(true)
    const existing = await db.user_profile.get("profile")
    const next: UserProfile = {
      ...(existing ?? DEFAULT_PROFILE),
      ...updates,
      id: "profile",
      updated_at: now(),
    }
    await db.user_profile.put(next)
    logger.info("profile", "profile updated", next)
    setIsPending(false)
  }, [])

  return { mutate, isPending }
}

export function useEnsureProfile() {
  useEffect(() => {
    db.user_profile.get("profile").then((p) => {
      if (!p) {
        logger.info("profile", "no profile — seeding defaults")
        db.user_profile.put({ ...DEFAULT_PROFILE, updated_at: now() })
      }
    }).catch((err) => logger.error("profile", "ensureProfile failed", err))
  }, [])
}
