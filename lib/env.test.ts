describe("env", () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it("throws when AUTH_PASSWORD is not set", () => {
    delete process.env.AUTH_PASSWORD
    delete process.env.NEXT_PUBLIC_AUTH_PASSWORD
    const { getAuthPassword } = require("./env")
    expect(() => getAuthPassword()).toThrow("AUTH_PASSWORD not set")
  })

  it("returns AUTH_PASSWORD when set", () => {
    process.env.AUTH_PASSWORD = "testpass"
    const { getAuthPassword } = require("./env")
    expect(getAuthPassword()).toBe("testpass")
  })

  it("reads NEXT_PUBLIC_AUTH_PASSWORD as fallback", () => {
    process.env.NEXT_PUBLIC_AUTH_PASSWORD = "publicpass"
    const { getAuthPassword } = require("./env")
    expect(getAuthPassword()).toBe("publicpass")
  })
})
