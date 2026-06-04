"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { loginAction } from "./actions"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    if (!password.trim()) {
      setError("Password is required")
      return
    }

    const { success } = await loginAction(password)
    if (success) {
      sessionStorage.setItem("shred_session", "authenticated")
      router.push("/dashboard")
    } else {
      setError("Invalid password")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">SHRED</h1>
        <p className="text-center text-[#a0a0a0] text-sm">Enter password to continue</p>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full"
            autoFocus
          />
        </div>

        {error && (
          <p className="text-[#ef4444] text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-[#4f9cf7] py-2 font-bold text-white hover:bg-[#3d8ae5] transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  )
}
