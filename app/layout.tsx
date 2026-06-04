import { validateEnv } from "@/lib/validate-env"
validateEnv()

import type { Metadata, Viewport } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { OfflineBanner } from "@/components/offline-banner"
import { RegisterSW } from "@/components/register-sw"
import { SeedData } from "@/components/seed-data"
import { SyncOnMount } from "@/components/sync-on-mount"
import { NavBar } from "@/components/nav-bar"

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SHRED",
  description: "Smart workout tracker",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#4f9cf7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.className} min-h-screen bg-[#0a0a0a] text-[#e0e0e0]`}>
        <OfflineBanner />
        <RegisterSW />
        <SeedData />
        <SyncOnMount />
        <NavBar />
        <main className="mx-auto max-w-lg px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4">{children}</main>
      </body>
    </html>
  )
}
