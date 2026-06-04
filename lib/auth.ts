// Cookie is httpOnly — JS cannot read or clear it directly.
// Server middleware (proxy.ts) enforces auth on every request.

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" })
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

// Always returns true — if session were invalid, server would have
// redirected to /login before the page rendered.
export function isAuthenticated(): boolean {
  return true
}

// no-op: proxy.ts handles enforcement
export function requireAuth(): void {}

