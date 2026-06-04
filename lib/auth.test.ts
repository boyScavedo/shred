/**
 * @jest-environment node
 */

describe("auth", () => {
  const origWindow = globalThis.window

  beforeEach(() => {
    let cookieStore = ""
    globalThis.window = {} as Window & typeof globalThis
    ;(globalThis as Record<string, unknown>).document = {
      get cookie() { return cookieStore },
      set cookie(val: string) {
        // Simulate browser cookie setting (simplified)
        const [pair] = val.split(";")
        const [name, value] = pair.split("=")
        if (val.includes("max-age=0")) {
          cookieStore = cookieStore
            .split(";")
            .filter((c) => !c.trim().startsWith(`${name.trim()}=`))
            .join(";")
        } else {
          cookieStore = cookieStore
            ? `${cookieStore}; ${name.trim()}=${value?.trim() ?? ""}`
            : `${name.trim()}=${value?.trim() ?? ""}`
        }
      },
    }
  })

  afterEach(() => {
    globalThis.window = origWindow
  })

  it("isAuthenticated returns true when cookie is set", () => {
    const { isAuthenticated } = require("./auth")
    document.cookie = "shred_session=authenticated; path=/"
    expect(isAuthenticated()).toBe(true)
  })

  it("logout clears cookie and isAuthenticated returns false", () => {
    const { logout, isAuthenticated } = require("./auth")
    document.cookie = "shred_session=authenticated; path=/"
    expect(isAuthenticated()).toBe(true)
    logout()
    expect(isAuthenticated()).toBe(false)
  })
})
