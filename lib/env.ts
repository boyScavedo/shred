const AUTH_PASSWORD = process.env.NEXT_PUBLIC_AUTH_PASSWORD || process.env.AUTH_PASSWORD

export function getAuthPassword(): string {
  if (!AUTH_PASSWORD) throw new Error("AUTH_PASSWORD not set in environment")
  return AUTH_PASSWORD
}
