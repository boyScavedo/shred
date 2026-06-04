import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ExerciseBlock } from "./exercise-block"
import type { Exercise, WorkoutExercise, WorkoutSet } from "@/types"

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
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
    ...overrides,
  }
}

function makeWorkoutExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    id: "we-1",
    session_id: "s-1",
    exercise_id: "push-up",
    sort_order: 1,
    notes: null,
    ...overrides,
  }
}

function makeSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: `set-${Math.random().toString(36).slice(2, 7)}`,
    workout_exercise_id: "we-1",
    set_number: 1,
    reps: null,
    weight_kg: null,
    duration_secs: null,
    rpe: null,
    set_type: "normal",
    is_completed: false,
    ...overrides,
  }
}

describe("ExerciseBlock", () => {
  it("renders exercise name and prescription", () => {
    const exercise = makeExercise({ default_sets: 3, default_reps_min: 8, default_reps_max: 12 })
    const we = makeWorkoutExercise()
    const sets = [makeSet({ set_number: 1 }), makeSet({ set_number: 2 }), makeSet({ set_number: 3 })]

    render(
      <ExerciseBlock
        workoutExercise={we}
        exercise={exercise}
        sets={sets}
        onUpdateSet={jest.fn()}
        onAddSet={jest.fn()}
        onRemove={jest.fn()}
      />
    )

    expect(screen.getByText("Push-up")).toBeInTheDocument()
    expect(screen.getByText(/3×8.12/)).toBeInTheDocument()
  })

  it("shows all set rows", () => {
    const exercise = makeExercise()
    const we = makeWorkoutExercise()
    const sets = [
      makeSet({ id: "s1", set_number: 1, reps: 10 }),
      makeSet({ id: "s2", set_number: 2, reps: 8 }),
    ]

    render(
      <ExerciseBlock
        workoutExercise={we}
        exercise={exercise}
        sets={sets}
        onUpdateSet={jest.fn()}
        onAddSet={jest.fn()}
        onRemove={jest.fn()}
      />
    )

    expect(screen.getByDisplayValue("10")).toBeInTheDocument()
    expect(screen.getByDisplayValue("8")).toBeInTheDocument()
  })

  it("calls onUpdateSet when reps input changes", async () => {
    const onUpdateSet = jest.fn()
    const exercise = makeExercise()
    const we = makeWorkoutExercise()
    const sets = [makeSet({ id: "s1", set_number: 1, reps: null })]

    render(
      <ExerciseBlock
        workoutExercise={we}
        exercise={exercise}
        sets={sets}
        onUpdateSet={onUpdateSet}
        onAddSet={jest.fn()}
        onRemove={jest.fn()}
      />
    )

    const repsInput = screen.getByLabelText("Set 1 reps")
    fireEvent.change(repsInput, { target: { value: "12" } })

    expect(onUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ id: "s1", reps: 12 }))
  })

  it("calls onUpdateSet when RPE selected", async () => {
    const onUpdateSet = jest.fn()
    const exercise = makeExercise()
    const we = makeWorkoutExercise()
    const sets = [makeSet({ id: "s1", set_number: 1, rpe: null })]

    render(
      <ExerciseBlock
        workoutExercise={we}
        exercise={exercise}
        sets={sets}
        onUpdateSet={onUpdateSet}
        onAddSet={jest.fn()}
        onRemove={jest.fn()}
      />
    )

    const rpeSelect = screen.getByLabelText("Set 1 RPE")
    await userEvent.selectOptions(rpeSelect, "8")

    expect(onUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ id: "s1", rpe: 8 }))
  })

  it("calls onUpdateSet when completed checkbox toggled", async () => {
    const onUpdateSet = jest.fn()
    const exercise = makeExercise()
    const we = makeWorkoutExercise()
    const sets = [makeSet({ id: "s1", set_number: 1, is_completed: false })]

    render(
      <ExerciseBlock
        workoutExercise={we}
        exercise={exercise}
        sets={sets}
        onUpdateSet={onUpdateSet}
        onAddSet={jest.fn()}
        onRemove={jest.fn()}
      />
    )

    const checkbox = screen.getByLabelText("Set 1 completed")
    await userEvent.click(checkbox)

    expect(onUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ id: "s1", is_completed: true }))
  })

  it("calls onAddSet when add set button clicked", async () => {
    const onAddSet = jest.fn()
    const exercise = makeExercise()
    const we = makeWorkoutExercise()
    const sets = [makeSet({ set_number: 1 })]

    render(
      <ExerciseBlock
        workoutExercise={we}
        exercise={exercise}
        sets={sets}
        onUpdateSet={jest.fn()}
        onAddSet={onAddSet}
        onRemove={jest.fn()}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: /add set/i }))
    expect(onAddSet).toHaveBeenCalledTimes(1)
  })

  it("calls onRemove when remove button clicked", async () => {
    const onRemove = jest.fn()
    const exercise = makeExercise()
    const we = makeWorkoutExercise()
    const sets = [makeSet({ set_number: 1 })]

    render(
      <ExerciseBlock
        workoutExercise={we}
        exercise={exercise}
        sets={sets}
        onUpdateSet={jest.fn()}
        onAddSet={jest.fn()}
        onRemove={onRemove}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: /remove exercise/i }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it("shows duration inputs for duration-based exercises", () => {
    const exercise = makeExercise({
      load_type: "duration",
      prescription_mode: "bodyweight_duration",
      default_duration_secs: 45,
      default_reps_min: null,
      default_reps_max: null,
    })
    const we = makeWorkoutExercise()
    const sets = [makeSet({ set_number: 1, duration_secs: 45, reps: null, weight_kg: null })]

    render(
      <ExerciseBlock
        workoutExercise={we}
        exercise={exercise}
        sets={sets}
        onUpdateSet={jest.fn()}
        onAddSet={jest.fn()}
        onRemove={jest.fn()}
      />
    )

    expect(screen.getByLabelText("Set 1 duration (s)")).toBeInTheDocument()
    expect(screen.getByDisplayValue("45")).toBeInTheDocument()
  })

  it("shows weight input for weighted exercises", () => {
    const exercise = makeExercise({
      resistance_type: "dumbbell",
      prescription_mode: "weight_reps",
    })
    const we = makeWorkoutExercise()
    const sets = [makeSet({ set_number: 1, weight_kg: 20 })]
    const onUpdateSet = jest.fn()

    render(
      <ExerciseBlock
        workoutExercise={we}
        exercise={exercise}
        sets={sets}
        onUpdateSet={onUpdateSet}
        onAddSet={jest.fn()}
        onRemove={jest.fn()}
      />
    )

    expect(screen.getByLabelText("Set 1 weight (kg)")).toBeInTheDocument()
    expect(screen.getByDisplayValue("20")).toBeInTheDocument()
  })

  it("hides weight input for bodyweight exercises", () => {
    const exercise = makeExercise({ resistance_type: "bodyweight", prescription_mode: "bodyweight_reps" })
    const we = makeWorkoutExercise()
    const sets = [makeSet({ set_number: 1, reps: 10, weight_kg: null })]

    render(
      <ExerciseBlock
        workoutExercise={we}
        exercise={exercise}
        sets={sets}
        onUpdateSet={jest.fn()}
        onAddSet={jest.fn()}
        onRemove={jest.fn()}
      />
    )

    expect(screen.queryByLabelText("Set 1 weight (kg)")).not.toBeInTheDocument()
  })
})
