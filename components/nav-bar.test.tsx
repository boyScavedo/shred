import { render, screen } from "@testing-library/react"
import { NavBar } from "./nav-bar"

const mockUsePathname = jest.fn()

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}))

beforeEach(() => {
  mockUsePathname.mockReturnValue("/dashboard")
})

describe("NavBar", () => {
  it("renders all nav links", () => {
    render(<NavBar />)
    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Workout")).toBeInTheDocument()
    expect(screen.getByText("Plan")).toBeInTheDocument()
    expect(screen.getByText("Profile")).toBeInTheDocument()
  })

  it("does not render on /login", () => {
    mockUsePathname.mockReturnValue("/login")
    const { container } = render(<NavBar />)
    expect(container.innerHTML).toBe("")
  })

  it("does not render on login sub-paths", () => {
    mockUsePathname.mockReturnValue("/login/")
    const { container } = render(<NavBar />)
    expect(container.innerHTML).toBe("")
  })
})
