const SESSION_KEY = "shred_session"

export function logout(): void {
  if (typeof window !== "undefined") {
    document.cookie = `${SESSION_KEY}=; path=/; max-age=0`
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return document.cookie.split(";").some((c) => c.trim() === `${SESSION_KEY}=authenticated`)
}

export function requireAuth(): void {
  if (!isAuthenticated() && typeof window !== "undefined") {
    window.location.href = "/login"
  }
}
