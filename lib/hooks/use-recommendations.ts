"use client"

import { useState, useEffect } from "react"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { useExercises } from "@/lib/hooks/use-exercises"
import { generateRecommendation, generateGradedPlans } from "@/lib/recommendations"
import type { WorkoutRecommendation, GradedPlan } from "@/lib/recommendations"

export function useRecommendations() {
  const { profile, loading: profileLoading } = useUserProfile()
  const exercises = useExercises()
  const [recommendation, setRecommendation] = useState<WorkoutRecommendation | null>(null)
  const [gradedPlans, setGradedPlans] = useState<GradedPlan[]>([])

  useEffect(() => {
    if (!profile || exercises.length === 0) return
    const input = {
      goal: profile.goal,
      body_goal: profile.body_goal,
      experience: profile.experience,
      days_per_week: profile.days_per_week,
      equipment: profile.equipment,
      exercises,
    }
    setRecommendation(generateRecommendation(input))
    setGradedPlans(generateGradedPlans(input))
  }, [profile, exercises])

  return { recommendation, gradedPlans, loading: profileLoading }
}
