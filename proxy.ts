import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedPaths = [
  "/dashboard", "/workout", "/history", "/exercises",
  "/guide", "/templates", "/recommendations", "/profile",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected) {
    const session = request.cookies.get("shred_session")
    if (!session || session.value !== "authenticated") {
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
