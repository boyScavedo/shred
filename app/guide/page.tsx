"use client"

import { useGuide } from "@/lib/hooks/use-guide"

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function RecoveryIndicator() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded">
      Recovery
    </span>
  )
}

export default function GuidePage() {
  const plan = useGuide()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Smart Guide</h1>
      <p className="text-sm text-[#a0a0a0]">
        Your personalized weekly training plan based on available exercises and recovery status.
      </p>

      {plan.length === 0 ? (
        <p className="text-[#a0a0a0] text-sm text-center py-8">
          No exercises found. Add exercises to your library to generate a plan.
        </p>
      ) : (
        <div className="space-y-3">
          {plan.map((day) => {
            const dayName = DAY_NAMES[day.day] ?? `Day ${day.day}`
            const hasRecovery = day.muscleGroups.length === 0

            return (
              <div key={day.day} className="rounded-lg bg-[#1a1a1a] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-sm">{dayName}</h2>
                    <p className="text-xs text-[#4f9cf7]">{day.label}</p>
                  </div>
                  {hasRecovery && <RecoveryIndicator />}
                </div>

                <div className="space-y-1">
                  {day.exercises.map((ge) => (
                    <div key={ge.exercise.id} className="flex items-center justify-between text-sm">
                      <span>{ge.exercise.name}</span>
                      <span className="text-xs text-[#a0a0a0]">
                        {ge.exercise.load_type === "reps"
                          ? `${ge.targetSets}×${ge.targetRepsMin}-${ge.targetRepsMax}`
                          : `${ge.targetSets}×${ge.targetRepsMin ?? ""} reps`}
                      </span>
                    </div>
                  ))}
                </div>

                {day.muscleGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {day.muscleGroups.map((mg) => (
                      <span
                        key={mg}
                        className="text-xs text-[#a0a0a0] bg-[#2a2a2a] px-2 py-0.5 rounded"
                      >
                        {mg}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
