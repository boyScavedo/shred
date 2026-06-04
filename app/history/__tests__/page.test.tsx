import "fake-indexeddb/auto"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HistoryPage from "../page"
import { db } from "@/lib/db"
import type { WorkoutSession, Exercise } from "@/types"

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    duration_secs: 1800,
    pre_workout_calories: null,
    calories_burned_estimate: null,
    notes: null,
    ...overrides,
  }
}

beforeEach(async () => {
  await db.workout_sessions.clear()
  await db.workout_exercises.clear()
  await db.workout_sets.clear()
  await db.exercises.clear()
})

afterAll(() => {
  db.close()
})

describe("History Page", () => {
  it("shows empty state when no completed sessions", async () => {
    render(<HistoryPage />)
    expect(await screen.findByText(/no completed workouts/i)).toBeInTheDocument()
  })

  it("shows session list", async () => {
    await db.workout_sessions.add(makeSession({ id: "s-1" }))

    render(<HistoryPage />)
    expect(await screen.findByText("30 min")).toBeInTheDocument()
  })

  it("shows exercise details when session is expanded", async () => {
    await db.workout_sessions.add(makeSession({ id: "s-expand" }))
    await db.exercises.add({
      id: "push-up",
      name: "Push-up",
      mechanics: "compound",
      movement_pattern: "push",
      resistance_type: "bodyweight",
      load_type: "reps",
      muscle_group_primary: "chest",
      muscle_group_secondary: null,
      prescription_mode: "bodyweight_reps",
      default_sets: 3,
      default_reps_min: 8,
      default_reps_max: 12,
      default_duration_secs: null,
      bodyweight_progression_id: null,
      equipment_required: [],
      created_at: new Date().toISOString(),
    })
    await db.workout_exercises.add({
      id: "we-1",
      session_id: "s-expand",
      exercise_id: "push-up",
      sort_order: 1,
      notes: null,
    })
    await db.workout_sets.add({
      id: "set-1",
      workout_exercise_id: "we-1",
      set_number: 1,
      reps: 10,
      weight_kg: null,
      duration_secs: null,
      rpe: 8,
      set_type: "normal",
      is_completed: true,
    })

    render(<HistoryPage />)
    await screen.findByText("30 min")

    await userEvent.click(screen.getByText("30 min").closest("div[class*='rounded-lg']")!)

    expect(await screen.findByText("Push-up")).toBeInTheDocument()
    expect(screen.getByText("10 reps")).toBeInTheDocument()
    expect(screen.getByText("RPE 8")).toBeInTheDocument()
  })
})
