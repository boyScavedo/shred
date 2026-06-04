import "fake-indexeddb/auto"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ExercisesPage from "../page"
import { db } from "@/lib/db"
import type { Exercise } from "@/types"

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

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
  await db.exercises.clear()
})

afterAll(() => {
  db.close()
})

describe("Exercises Page", () => {
  it("renders the page title", async () => {
    render(<ExercisesPage />)
    expect(screen.getByText("Exercise Library")).toBeInTheDocument()
  })

  it("shows empty state when no exercises exist", async () => {
    render(<ExercisesPage />)
    expect(await screen.findByText("No exercises found")).toBeInTheDocument()
  })

  it("displays exercises from the database", async () => {
    await db.exercises.bulkAdd([
      makeExercise("Push-up"),
      makeExercise("Squat", { id: "squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
    ])

    render(<ExercisesPage />)
    expect(await screen.findByText("Push-up")).toBeInTheDocument()
    const cards = screen.getAllByRole("heading", { level: 3 })
    expect(cards.map((c) => c.textContent)).toContain("Squat")
  })

  it("filters by muscle group", async () => {
    await db.exercises.bulkAdd([
      makeExercise("Push-up", { muscle_group_primary: "chest" }),
      makeExercise("Squat", { id: "squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
    ])

    render(<ExercisesPage />)
    await screen.findByText("Push-up")

    const select = screen.getByLabelText("Muscle Group")
    await userEvent.selectOptions(select, "quads")

    expect(screen.queryByText("Push-up")).not.toBeInTheDocument()
    const cards = screen.getAllByRole("heading", { level: 3 })
    expect(cards.map((c) => c.textContent)).toEqual(["Squat"])
  })

  it("filters by movement pattern", async () => {
    await db.exercises.bulkAdd([
      makeExercise("Push-up", { movement_pattern: "push" }),
      makeExercise("Squat", { id: "squat", movement_pattern: "squat", muscle_group_primary: "quads" }),
    ])

    render(<ExercisesPage />)
    await screen.findByText("Push-up")

    const select = screen.getByLabelText("Movement Pattern")
    await userEvent.selectOptions(select, "squat")

    expect(screen.queryByText("Push-up")).not.toBeInTheDocument()
    const cards = screen.getAllByRole("heading", { level: 3 })
    expect(cards.map((c) => c.textContent)).toEqual(["Squat"])
  })

  it("shows exercise details", async () => {
    await db.exercises.add(makeExercise("Bench Press", { default_sets: 4, default_reps_min: 8, default_reps_max: 10 }))

    render(<ExercisesPage />)
    expect(await screen.findByText("Bench Press")).toBeInTheDocument()
    expect(screen.getByText("4×8-10")).toBeInTheDocument()
  })
})
