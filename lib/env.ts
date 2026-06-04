// Never use NEXT_PUBLIC_ prefix — that bakes the value into the browser bundle
const AUTH_PASSWORD = process.env.AUTH_PASSWORD

export function getAuthPassword(): string {
  if (!AUTH_PASSWORD) throw new Error("AUTH_PASSWORD not set in environment")
  return AUTH_PASSWORD
}
