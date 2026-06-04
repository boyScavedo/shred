"use client"

import { useState, useEffect } from "react"
import { useUserProfile, useUpdateUserProfile } from "@/lib/hooks/use-user-profile"
import { logout } from "@/lib/auth"
import { useRouter } from "next/navigation"
import type { FitnessGoal, BodyGoal, ExperienceLevel, ResistanceType } from "@/types"

const GOALS: { value: FitnessGoal; label: string; desc: string }[] = [
  { value: "strength",    label: "Strength",    desc: "Max force — low reps, heavy weight, long rest" },
  { value: "hypertrophy", label: "Hypertrophy", desc: "Muscle size — moderate reps, high volume" },
  { value: "endurance",   label: "Endurance",   desc: "Stamina — high reps, short rest, circuits" },
  { value: "general",     label: "General",     desc: "All-round fitness — balanced approach" },
]

const BODY_GOALS: { value: BodyGoal; label: string; emoji: string; desc: string }[] = [
  { value: "bulking",     label: "Bulking",     emoji: "📈", desc: "Calorie surplus — build muscle mass" },
  { value: "maintaining", label: "Maintaining", emoji: "⚖️", desc: "Maintenance calories — body recomp" },
  { value: "cutting",     label: "Cutting",     emoji: "📉", desc: "Calorie deficit — lose fat, keep muscle" },
]

const EXPERIENCE: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: "beginner",     label: "Beginner",     desc: "< 1 year consistent training" },
  { value: "intermediate", label: "Intermediate", desc: "1–3 years, familiar with main lifts" },
  { value: "advanced",     label: "Advanced",     desc: "3+ years, periodised training" },
]

const EQUIPMENT_OPTIONS: { value: ResistanceType; label: string }[] = [
  { value: "bodyweight",          label: "Bodyweight only" },
  { value: "barbell",             label: "Barbell + plates" },
  { value: "dumbbell",            label: "Dumbbells" },
  { value: "cable",               label: "Cable machine" },
  { value: "machine",             label: "Machines" },
  { value: "kettlebell",          label: "Kettlebells" },
  { value: "band",                label: "Resistance bands" },
  { value: "weighted_bodyweight", label: "Weight vest / belt" },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2">{children}</p>
}

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-3 transition-all ${
        selected
          ? "border-[#4f9cf7] bg-[#4f9cf7]/10 text-[#e0e0e0]"
          : "border-[#2a2a2a] bg-[#1a1a1a] text-[#a0a0a0] hover:border-[#444]"
      }`}
    >
      {children}
    </button>
  )
}

export default function ProfilePage() {
  const { profile, loading } = useUserProfile()
  const { mutate: update, isPending } = useUpdateUserProfile()
  const router = useRouter()

  const [goal, setGoal] = useState<FitnessGoal>("hypertrophy")
  const [bodyGoal, setBodyGoal] = useState<BodyGoal>("maintaining")
  const [experience, setExperience] = useState<ExperienceLevel>("beginner")
  const [days, setDays] = useState(4)
  const [equipment, setEquipment] = useState<ResistanceType[]>(["bodyweight"])
  const [bw, setBw] = useState("")
  const [targetBw, setTargetBw] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setGoal(profile.goal)
      setBodyGoal(profile.body_goal)
      setExperience(profile.experience)
      setDays(profile.days_per_week)
      setEquipment(profile.equipment)
      setBw(profile.bodyweight_kg?.toString() ?? "")
      setTargetBw(profile.target_bodyweight_kg?.toString() ?? "")
    }
  }, [profile])

  const toggleEquipment = (eq: ResistanceType) => {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    )
  }

  const handleSave = async () => {
    await update({
      goal,
      body_goal: bodyGoal,
      experience,
      days_per_week: days,
      equipment,
      bodyweight_kg: bw ? parseFloat(bw) : null,
      target_bodyweight_kg: targetBw ? parseFloat(targetBw) : null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  if (loading) {
    return <div className="text-center py-12 text-[#a0a0a0] text-sm">Loading...</div>
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Profile</h1>
        <button
          onClick={handleLogout}
          className="text-xs text-[#ef4444] hover:text-[#dc2626] transition-colors"
        >
          Log out
        </button>
      </div>

      {/* Fitness Goal */}
      <div>
        <SectionLabel>Training Goal</SectionLabel>
        <div className="space-y-2">
          {GOALS.map((g) => (
            <OptionCard key={g.value} selected={goal === g.value} onClick={() => setGoal(g.value)}>
              <p className="font-bold text-sm">{g.label}</p>
              <p className="text-xs mt-0.5 opacity-70">{g.desc}</p>
            </OptionCard>
          ))}
        </div>
      </div>

      {/* Body Goal */}
      <div>
        <SectionLabel>Body Composition Goal</SectionLabel>
        <div className="space-y-2">
          {BODY_GOALS.map((bg) => (
            <button
              key={bg.value}
              onClick={() => setBodyGoal(bg.value)}
              className={`w-full text-left rounded-lg border p-3 transition-all ${
                bodyGoal === bg.value
                  ? "border-[#4f9cf7] bg-[#4f9cf7]/10"
                  : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#444]"
              }`}
            >
              <div className="flex items-center gap-3">
                <p className="text-lg">{bg.emoji}</p>
                <div>
                  <p className="text-sm font-bold">{bg.label}</p>
                  <p className="text-xs text-[#666]">{bg.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div>
        <SectionLabel>Experience Level</SectionLabel>
        <div className="space-y-2">
          {EXPERIENCE.map((e) => (
            <OptionCard key={e.value} selected={experience === e.value} onClick={() => setExperience(e.value)}>
              <p className="font-bold text-sm">{e.label}</p>
              <p className="text-xs mt-0.5 opacity-70">{e.desc}</p>
            </OptionCard>
          ))}
        </div>
      </div>

      {/* Days per week */}
      <div>
        <SectionLabel>Training Days / Week</SectionLabel>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`flex-1 rounded-lg border py-2 text-sm font-bold transition-all ${
                days === d
                  ? "border-[#4f9cf7] bg-[#4f9cf7]/10 text-[#4f9cf7]"
                  : "border-[#2a2a2a] bg-[#1a1a1a] text-[#a0a0a0] hover:border-[#444]"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <SectionLabel>Available Equipment</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {EQUIPMENT_OPTIONS.map((eq) => (
            <button
              key={eq.value}
              onClick={() => toggleEquipment(eq.value)}
              className={`rounded-lg border px-3 py-2 text-xs font-bold text-left transition-all ${
                equipment.includes(eq.value)
                  ? "border-[#4f9cf7] bg-[#4f9cf7]/10 text-[#4f9cf7]"
                  : "border-[#2a2a2a] bg-[#1a1a1a] text-[#a0a0a0] hover:border-[#444]"
              }`}
            >
              {eq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bodyweight */}
      <div>
        <SectionLabel>Bodyweight (optional)</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#666] mb-1 block">Current (kg)</label>
            <input
              type="number"
              value={bw}
              onChange={(e) => setBw(e.target.value)}
              placeholder="75"
              min={30}
              max={300}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm focus:border-[#4f9cf7] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-[#666] mb-1 block">Target (kg)</label>
            <input
              type="number"
              value={targetBw}
              onChange={(e) => setTargetBw(e.target.value)}
              placeholder="80"
              min={30}
              max={300}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm focus:border-[#4f9cf7] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className={`w-full rounded-lg py-3 font-bold text-sm transition-all ${
          saved
            ? "bg-[#22c55e] text-white"
            : "bg-[#4f9cf7] text-white hover:bg-[#3d8ae5] disabled:opacity-50"
        }`}
      >
        {saved ? "Saved!" : isPending ? "Saving..." : "Save Profile"}
      </button>
    </div>
  )
}
