import { createHmac, timingSafeEqual } from "crypto"

const VERSION = "shred:session:v1"

export function signSession(secret: string): string {
  return createHmac("sha256", secret).update(VERSION).digest("hex")
}

export function verifySession(cookie: string, secret: string): boolean {
  try {
    const expected = signSession(secret)
    const a = Buffer.from(cookie.padEnd(64).slice(0, 64))
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function getAuthSecret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error("AUTH_SECRET not set")
  return s
}
