import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession } from "@/lib/session"

const protectedPaths = [
  "/dashboard", "/workout", "/history", "/exercises",
  "/guide", "/templates", "/recommendations", "/profile",
]

// Known crawler/bot UA substrings — returns 404 so site appears non-existent
const BOT_PATTERNS = [
  "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider",
  "yandexbot", "sogou", "exabot", "facebot", "ia_archiver",
  "semrushbot", "ahrefsbot", "mj12bot", "dotbot", "rogerbot",
  "screaming frog", "gptbot", "chatgpt-user", "claude-web",
  "claudebot", "anthropic-ai", "ccbot", "cohere-ai", "perplexitybot",
  "bytespider", "petalbot", "applebot", "amazonbot", "twitterbot",
  "linkedinbot", "facebookexternalhit", "whatsapp", "telegrambot",
]

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase()
  return BOT_PATTERNS.some((p) => lower.includes(p))
}

export function proxy(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? ""
  if (isBot(ua)) {
    return new NextResponse(null, { status: 404 })
  }

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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
