"use client"

import { useEffect } from "react"
import { registerSW } from "@/lib/pwa"

export function RegisterSW() {
  useEffect(() => {
    registerSW()
  }, [])

  return null
}
