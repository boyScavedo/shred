const REQUIRED = ["AUTH_PASSWORD", "AUTH_SECRET", "DATABASE_URL"] as const

export function validateEnv(): void {
  // Skip during build — env vars are only available at runtime
  if (process.env.NEXT_PHASE === "phase-production-build") return

  const missing = REQUIRED.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}
