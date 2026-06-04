import "fake-indexeddb/auto"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import WorkoutPage from "../page"
import { db } from "@/lib/db"
import type { WorkoutSession, Exercise, WorkoutSet } from "@/types"

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: "s-test",
    started_at: new Date().toISOString(),
    completed_at: null,
    duration_secs: null,
    pre_workout_calories: null,
    calories_burned_estimate: null,
    notes: null,
    ...overrides,
  }
}

function makeExercise(name: string, overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
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

describe("Workout Page", () => {
  it("shows start workout prompt when no active workout", async () => {
    render(<WorkoutPage />)
    expect(await screen.findByText("No active workout")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /start workout/i })).toBeInTheDocument()
  })

  it("starts a new workout", async () => {
    render(<WorkoutPage />)
    await screen.findByText("No active workout")

    await userEvent.click(screen.getByRole("button", { name: /start workout/i }))

    expect(await screen.findByText(/workout in progress/i)).toBeInTheDocument()
  })

  it("shows active workout in progress", async () => {
    await db.workout_sessions.add(makeSession({ id: "s-active" }))

    render(<WorkoutPage />)
    expect(await screen.findByText(/workout in progress/i)).toBeInTheDocument()
  })

  it("starts with no exercises and shows add button", async () => {
    await db.workout_sessions.add(makeSession({ id: "s-active" }))
    await db.exercises.bulkAdd([
      makeExercise("Push-up"),
      makeExercise("Squat", { id: "squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
    ])

    render(<WorkoutPage />)
    await screen.findByText(/workout in progress/i)

    expect(screen.getByText("No exercises added yet")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /add exercise/i })).toBeInTheDocument()
  })

  it("opens dialog when add exercise is clicked", async () => {
    await db.workout_sessions.add(makeSession({ id: "s-active" }))
    await db.exercises.bulkAdd([
      makeExercise("Push-up"),
      makeExercise("Squat", { id: "squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
    ])

    render(<WorkoutPage />)
    await screen.findByText(/workout in progress/i)

    await userEvent.click(screen.getByRole("button", { name: /add exercise/i }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Push-up")).toBeInTheDocument()
  })

  it("adds exercise to the database on dialog click and creates empty sets", async () => {
    await db.workout_sessions.add(makeSession({ id: "s-active" }))
    await db.exercises.bulkAdd([
      makeExercise("Push-up", { default_sets: 3 }),
      makeExercise("Squat", { id: "squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
    ])

    render(<WorkoutPage />)
    await screen.findByText(/workout in progress/i)
    await userEvent.click(screen.getByRole("button", { name: /add exercise/i }))
    await userEvent.click(screen.getByText("Push-up"))

    const sessionExercises = await db.workout_exercises.where("session_id").equals("s-active").toArray()
    expect(sessionExercises).toHaveLength(1)
    expect(sessionExercises[0].exercise_id).toBe("push-up")

    const sets = await db.workout_sets.where("workout_exercise_id").equals(sessionExercises[0].id).toArray()
    expect(sets).toHaveLength(3)
    const sorted = [...sets].sort((a: WorkoutSet, b: WorkoutSet) => a.set_number - b.set_number)
    expect(sorted.map((s: WorkoutSet) => s.set_number)).toEqual([1, 2, 3])
  })

  it("completes the workout", async () => {
    await db.workout_sessions.add(makeSession({ id: "s-active" }))

    render(<WorkoutPage />)
    await screen.findByText(/workout in progress/i)

    await userEvent.click(screen.getByRole("button", { name: /finish/i }))

    expect(await screen.findByText(/workout complete/i)).toBeInTheDocument()

    const session = await db.workout_sessions.get("s-active")
    expect(session?.completed_at).not.toBeNull()
  })
})
