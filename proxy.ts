import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession } from "@/lib/session"

const protectedPaths = [
  "/dashboard", "/workout", "/history", "/exercises",
  "/guide", "/templates", "/recommendations", "/profile",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected) {
    const secret = process.env.AUTH_SECRET
    const session = request.cookies.get("shred_session")
    const valid = !!secret && !!session && verifySession(session.value, secret)

    if (!valid) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/workout/:path*", "/history/:path*",
    "/exercises/:path*", "/guide/:path*", "/templates/:path*",
    "/recommendations/:path*", "/profile/:path*",
  ],
}
