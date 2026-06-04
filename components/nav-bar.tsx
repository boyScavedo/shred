"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

const NAV_ITEMS = [
  { href: "/dashboard",       label: "Home",    icon: "⊡" },
  { href: "/workout",         label: "Workout", icon: "◈" },
  { href: "/recommendations", label: "Plan",    icon: "◎" },
  { href: "/templates",       label: "Programs",icon: "▤" },
  { href: "/profile",         label: "Profile", icon: "◷" },
]

export function NavBar() {
  const pathname = usePathname()

  if (pathname.startsWith("/login")) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#2a2a2a] bg-[#0a0a0a] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-3 py-1 text-xs transition-colors ${
                isActive
                  ? "text-[#4f9cf7]"
                  : "text-[#666] hover:text-[#a0a0a0]"
              }`}
            >
              <span className="text-base leading-none mb-0.5">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
