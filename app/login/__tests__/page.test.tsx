import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LoginPage from "../page"

const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("../actions", () => ({
  loginAction: jest.fn(),
}))
const { loginAction: mockLoginAction } = jest.requireMock("../actions")

describe("Login Page", () => {
  beforeEach(() => {
    mockLoginAction.mockReset()
    mockPush.mockReset()
  })

  it("renders password input and submit button", () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument()
  })

  it("shows error on empty submit", async () => {
    render(<LoginPage />)
    await userEvent.click(screen.getByRole("button", { name: /login/i }))
    expect(screen.getByText("Password is required")).toBeInTheDocument()
  })

  it("shows error on invalid password", async () => {
    mockLoginAction.mockResolvedValue({ success: false })
    render(<LoginPage />)
    await userEvent.type(screen.getByPlaceholderText("Password"), "wrong")
    await userEvent.click(screen.getByRole("button", { name: /login/i }))
    expect(screen.getByText("Invalid password")).toBeInTheDocument()
  })

  it("redirects to dashboard on valid password", async () => {
    mockLoginAction.mockResolvedValue({ success: true })
    render(<LoginPage />)
    await userEvent.type(screen.getByPlaceholderText("Password"), "correct")
    await userEvent.click(screen.getByRole("button", { name: /login/i }))
    expect(mockPush).toHaveBeenCalledWith("/dashboard")
  })
})
