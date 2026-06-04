import "fake-indexeddb/auto"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { db } from "@/lib/db"
import NewTemplatePage from "./page"
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

const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/templates/new",
}))

beforeEach(async () => {
  await db.exercise_templates.clear()
  await db.template_exercises.clear()
  await db.exercises.clear()
  jest.clearAllMocks()
})

afterAll(() => {
  db.close()
})

it("creates a template with name and exercises", async () => {
  await db.exercises.bulkAdd([
    makeExercise({ id: "ex-1", name: "Bench Press" }),
    makeExercise({ id: "ex-2", name: "Squat" }),
  ])

  render(<NewTemplatePage />)

  const nameInput = screen.getByLabelText("Template Name")
  await userEvent.type(nameInput, "My Template")

  const benchBtn = screen.getByText("Bench Press")
  await userEvent.click(benchBtn)

  const saveBtn = screen.getByText("Save Template")
  await userEvent.click(saveBtn)

  await waitFor(async () => {
    const templates = await db.exercise_templates.toArray()
    expect(templates).toHaveLength(1)
    expect(templates[0].name).toBe("My Template")
  })

  const templateExercises = await db.template_exercises.toArray()
  expect(templateExercises).toHaveLength(1)
  expect(templateExercises[0].exercise_id).toBe("ex-1")

  expect(mockPush).toHaveBeenCalled()
})

it("shows error when saving without a name", async () => {
  render(<NewTemplatePage />)

  const saveBtn = screen.getByText("Save Template")
  await userEvent.click(saveBtn)

  expect(screen.getByText("Template name is required")).toBeInTheDocument()
})
