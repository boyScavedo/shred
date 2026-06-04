import "fake-indexeddb/auto"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DashboardPage from "../page"
import { db } from "@/lib/db"
import type { WorkoutSession } from "@/types"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

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
  mockPush.mockClear()
})

afterAll(() => {
  db.close()
})

describe("Dashboard Page", () => {
  it("shows the dashboard heading", async () => {
    render(<DashboardPage />)
    expect(await screen.findByText("Dashboard")).toBeInTheDocument()
  })

  it("shows start workout button", async () => {
    render(<DashboardPage />)
    expect(await screen.findByRole("button", { name: /start workout/i })).toBeInTheDocument()
  })

  it("shows empty state when no workouts exist", async () => {
    render(<DashboardPage />)
    expect(await screen.findByText(/no workouts yet/i)).toBeInTheDocument()
  })

  it("shows weekly workout count", async () => {
    await db.workout_sessions.bulkAdd([
      makeSession({ id: "s-1" }),
      makeSession({ id: "s-2" }),
    ])

    render(<DashboardPage />)
    expect(await screen.findByText("2")).toBeInTheDocument()
  })

  it("shows recent sessions", async () => {
    await db.workout_sessions.add(makeSession({ id: "s-recent" }))

    render(<DashboardPage />)
    expect(await screen.findByText("30 min")).toBeInTheDocument()
  })
})
