import "fake-indexeddb/auto"
import { render, screen, waitFor } from "@testing-library/react"
import { db } from "@/lib/db"
import GuidePage from "./page"
import type { Exercise } from "@/types"

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "Test Exercise",
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

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/guide",
}))

beforeEach(async () => {
  await db.exercises.clear()
  await db.workout_sessions.clear()
})

afterAll(() => {
  db.close()
})

it("shows empty state when no exercises exist", async () => {
  render(<GuidePage />)
  await screen.findByText(/Smart Guide/)
})

it("shows weekly plan when exercises exist", async () => {
  await db.exercises.bulkAdd([
    makeExercise({ id: "e1", name: "Push-up", movement_pattern: "push", muscle_group_primary: "chest" }),
  ])

  render(<GuidePage />)
  expect(await screen.findByText("Monday")).toBeInTheDocument()
  const pushUps = await screen.findAllByText("Push-up")
  expect(pushUps.length).toBeGreaterThan(0)
})

it("shows muscle group tags", async () => {
  await db.exercises.bulkAdd([
    makeExercise({ id: "e1", name: "Push-up", movement_pattern: "push", muscle_group_primary: "chest" }),
    makeExercise({ id: "e2", name: "Squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
  ])

  render(<GuidePage />)
  const chestTags = await screen.findAllByText("chest")
  expect(chestTags.length).toBeGreaterThan(0)
  const quadsTags = await screen.findAllByText("quads")
  expect(quadsTags.length).toBeGreaterThan(0)
})
