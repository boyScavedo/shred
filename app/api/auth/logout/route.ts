import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  const jar = await cookies()
  jar.set("shred_session", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  })
  return NextResponse.json({ success: true })
}
