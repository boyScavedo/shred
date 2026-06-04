describe("registerSW", () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
    delete (window as unknown as Record<string, unknown>).navigator
  })

  it("does nothing in node (no window)", () => {
    const { registerSW } = require("./pwa")
    expect(() => registerSW()).not.toThrow()
  })

  it("does not register in development mode", () => {
    process.env = { ...originalEnv, NODE_ENV: "development" }

    const register = jest.fn()
    Object.defineProperty(window, "navigator", {
      value: { serviceWorker: { register } },
      writable: true,
      configurable: true,
    })

    const { registerSW } = require("./pwa")
    registerSW()

    expect(register).not.toHaveBeenCalled()
  })

  it("registers service worker in production", () => {
    process.env = { ...originalEnv, NODE_ENV: "production" }

    const register = jest.fn().mockResolvedValue({})
    Object.defineProperty(window, "navigator", {
      value: { serviceWorker: { register } },
      writable: true,
      configurable: true,
    })

    const { registerSW } = require("./pwa")
    registerSW()

    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" })
  })
})
