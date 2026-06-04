"use server"

import { getAuthPassword } from "@/lib/env"
import { cookies } from "next/headers"

export async function loginAction(password: string): Promise<{ success: boolean }> {
  if (password === getAuthPassword()) {
    ;(await cookies()).set("shred_session", "authenticated", { path: "/", maxAge: 86400 })
    return { success: true }
  }
  return { success: false }
}
