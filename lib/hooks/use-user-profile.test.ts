import "fake-indexeddb/auto"
import { renderHook, act, waitFor } from "@testing-library/react"
import { db } from "@/lib/db"
import { useUserProfile, useUpdateUserProfile } from "./use-user-profile"

beforeEach(async () => {
  await db.user_profile.clear()
})

afterAll(() => {
  db.close()
})

describe("useUserProfile", () => {
  it("returns null when no profile exists", async () => {
    const { result } = renderHook(() => useUserProfile())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile).toBeNull()
  })

  it("returns profile when one exists", async () => {
    await db.user_profile.put({
      id: "profile",
      goal: "strength",
      body_goal: "bulking",
      experience: "intermediate",
      days_per_week: 5,
      equipment: ["barbell"],
      bodyweight_kg: 80,
      target_bodyweight_kg: 85,
      updated_at: new Date().toISOString(),
    })

    const { result } = renderHook(() => useUserProfile())
    await waitFor(() => expect(result.current.profile?.goal).toBe("strength"))
    expect(result.current.profile?.body_goal).toBe("bulking")
  })
})

describe("useUpdateUserProfile", () => {
  it("creates profile when none exists", async () => {
    const { result } = renderHook(() => useUpdateUserProfile())

    await act(async () => {
      await result.current.mutate({ goal: "endurance", days_per_week: 3 })
    })

    const stored = await db.user_profile.get("profile")
    expect(stored?.goal).toBe("endurance")
    expect(stored?.days_per_week).toBe(3)
  })

  it("merges partial updates into existing profile", async () => {
    await db.user_profile.put({
      id: "profile",
      goal: "strength",
      body_goal: "bulking",
      experience: "intermediate",
      days_per_week: 5,
      equipment: ["barbell"],
      bodyweight_kg: null,
      target_bodyweight_kg: null,
      updated_at: new Date().toISOString(),
    })

    const { result } = renderHook(() => useUpdateUserProfile())

    await act(async () => {
      await result.current.mutate({ body_goal: "cutting" })
    })

    const stored = await db.user_profile.get("profile")
    expect(stored?.goal).toBe("strength")
    expect(stored?.body_goal).toBe("cutting")
  })
})
