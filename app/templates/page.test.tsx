import "fake-indexeddb/auto"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { db } from "@/lib/db"
import TemplatesPage from "./page"

// Mock next/navigation
const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/templates",
}))

beforeEach(async () => {
  await db.exercise_templates.clear()
  await db.template_exercises.clear()
  jest.clearAllMocks()
})

afterAll(() => {
  db.close()
})

it("shows empty state when no templates exist", async () => {
  render(<TemplatesPage />)
  await screen.findByText("Create Template")
  expect(screen.getByText(/No templates yet/)).toBeInTheDocument()
})

it("renders a list of templates", async () => {
  await db.exercise_templates.add({
    id: "t-1",
    name: "Push Day",
    description: "Chest, shoulders, triceps",
    created_at: "2024-06-01T00:00:00Z",
  })
  await db.exercise_templates.add({
    id: "t-2",
    name: "Pull Day",
    description: null,
    created_at: "2024-06-02T00:00:00Z",
  })

  render(<TemplatesPage />)

  await screen.findByText("Push Day")
  expect(screen.getByText("Pull Day")).toBeInTheDocument()
  expect(screen.getByText("Chest, shoulders, triceps")).toBeInTheDocument()
})

it("navigates to create page on button click", async () => {
  render(<TemplatesPage />)
  const btn = await screen.findByText("Create Template")
  await userEvent.click(btn)
  expect(mockPush).toHaveBeenCalledWith("/templates/new")
})
