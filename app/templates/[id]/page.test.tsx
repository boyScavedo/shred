import "fake-indexeddb/auto"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { db } from "@/lib/db"
import TemplateDetailPage from "./page"
import type { Exercise, ExerciseTemplate, TemplateExercise } from "@/types"

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

const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: "t-1" }),
  usePathname: () => "/templates/t-1",
}))

beforeEach(async () => {
  await db.exercise_templates.clear()
  await db.template_exercises.clear()
  await db.exercises.clear()
  await db.workout_sessions.clear()
  await db.workout_exercises.clear()
  await db.workout_sets.clear()
  jest.clearAllMocks()
})

afterAll(() => {
  db.close()
})

it("shows template name and exercises", async () => {
  await db.exercise_templates.add({
    id: "t-1",
    name: "Push Day",
    description: "Chest focus",
    created_at: "2024-06-01T00:00:00Z",
  })
  await db.exercises.add(makeExercise({ id: "ex-1", name: "Bench Press" }))
  await db.template_exercises.add({
    id: "te-1",
    template_id: "t-1",
    exercise_id: "ex-1",
    sort_order: 1,
    target_sets: 4,
    target_reps_min: 8,
    target_reps_max: 12,
    target_weight_kg: 50,
    rest_secs: 90,
    rest_after_exercise_secs: 180,
  })

  render(<TemplateDetailPage />)

  await screen.findByText("Push Day")
  expect(screen.getByText("Chest focus")).toBeInTheDocument()
  expect(await screen.findByText("Bench Press")).toBeInTheDocument()
})

it("starts a workout from the template", async () => {
  await db.exercise_templates.add({
    id: "t-1",
    name: "Push Day",
    description: null,
    created_at: "2024-06-01T00:00:00Z",
  })
  await db.exercises.add(makeExercise({ id: "ex-1", name: "Bench Press" }))
  await db.template_exercises.add({
    id: "te-1",
    template_id: "t-1",
    exercise_id: "ex-1",
    sort_order: 1,
    target_sets: 3,
    target_reps_min: 8,
    target_reps_max: 12,
    target_weight_kg: null,
    rest_secs: 90,
    rest_after_exercise_secs: 180,
  })

  render(<TemplateDetailPage />)

  const startBtn = await screen.findByText("Start Workout")
  await userEvent.click(startBtn)

  await waitFor(async () => {
    const sessions = await db.workout_sessions.toArray()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].completed_at).toBeNull()
  })

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith("/workout")
  })
})

it("shows empty state when template not found", async () => {
  render(<TemplateDetailPage />)
  await screen.findByText("Template not found")
})
