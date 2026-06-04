"use server"

import { timingSafeEqual } from "crypto"
import { cookies, headers } from "next/headers"
import { getAuthPassword } from "@/lib/env"
import { signSession, getAuthSecret } from "@/lib/session"
import { getNeon, type NeonQueryFn } from "@/lib/neon"

const MAX_ATTEMPTS = 10
const WINDOW_MINUTES = 15


async function getClientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ??
    h.get("x-real-ip") ??
    "unknown"
  )
}

async function isRateLimited(ip: string): Promise<boolean> {
  const sql: NeonQueryFn | null = getNeon()
  if (!sql) return false
  try {
    const rows = await sql(
      `SELECT COUNT(*) AS count FROM login_attempts
       WHERE ip = $1 AND succeeded = false
       AND attempted_at > now() - interval '${WINDOW_MINUTES} minutes'`,
      [ip]
    )
    const count = Number((rows[0] as Record<string, unknown>)?.count ?? 0)
    return count >= MAX_ATTEMPTS
  } catch {
    return false
  }
}

async function recordAttempt(ip: string, succeeded: boolean): Promise<void> {
  const sql: NeonQueryFn | null = getNeon()
  if (!sql) return
  try {
    await sql(
      "INSERT INTO login_attempts (ip, succeeded) VALUES ($1, $2)",
      [ip, succeeded]
    )
  } catch {
    // non-fatal
  }
}

function safeCompare(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a)
    const bb = Buffer.from(b)
    if (ab.length !== bb.length) {
      // Still run comparison on equal-length buffers to avoid timing leak on length
      timingSafeEqual(Buffer.alloc(b.length), bb)
      return false
    }
    return timingSafeEqual(ab, bb)
  } catch {
    return false
  }
}

export async function loginAction(password: string): Promise<{ success: boolean; error?: string }> {
  const ip = await getClientIp()

  if (await isRateLimited(ip)) {
    return { success: false, error: "Too many attempts. Try again later." }
  }

  const correct = safeCompare(password, getAuthPassword())
  await recordAttempt(ip, correct)

  if (!correct) {
    return { success: false, error: "Invalid password." }
  }

  const secret = getAuthSecret()
  const token = signSession(secret)
  const isProd = process.env.NODE_ENV === "production"

  ;(await cookies()).set("shred_session", token, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
  })

  return { success: true }
}
