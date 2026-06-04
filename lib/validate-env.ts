const REQUIRED = ["AUTH_PASSWORD", "AUTH_SECRET", "DATABASE_URL"] as const

export function validateEnv(): void {
  const missing = REQUIRED.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}
