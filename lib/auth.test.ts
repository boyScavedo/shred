/**
 * @jest-environment node
 */

describe("auth", () => {
  beforeEach(() => jest.resetModules())

  it("isAuthenticated always returns true (server enforces auth via proxy.ts)", () => {
    const { isAuthenticated } = require("./auth")
    expect(isAuthenticated()).toBe(true)
  })

  it("requireAuth is a no-op", () => {
    const { requireAuth } = require("./auth")
    expect(() => requireAuth()).not.toThrow()
  })
})
