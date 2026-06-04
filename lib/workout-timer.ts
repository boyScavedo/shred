export function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// Epley 1RM formula
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps <= 0 || weight <= 0) return 0
  return Math.round(weight * (1 + reps / 30))
}

// Plate calculator — returns plates needed per side given a total weight and barbell weight
export function calculatePlates(
  targetWeight: number,
  barbellWeight = 20,
): { weight: number; count: number }[] {
  const available = [25, 20, 15, 10, 5, 2.5, 1.25]
  let remaining = (targetWeight - barbellWeight) / 2
  if (remaining <= 0) return []

  const plates: { weight: number; count: number }[] = []
  for (const plate of available) {
    if (remaining <= 0) break
    const count = Math.floor(remaining / plate)
    if (count > 0) {
      plates.push({ weight: plate, count })
      remaining -= plate * count
    }
  }
  return plates
}
