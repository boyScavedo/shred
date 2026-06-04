import { formatDuration, estimateOneRepMax, calculatePlates } from "./workout-timer"

describe("formatDuration", () => {
  it("formats seconds < 1 min", () => {
    expect(formatDuration(45)).toBe("00:45")
  })
  it("formats minutes", () => {
    expect(formatDuration(90)).toBe("01:30")
  })
  it("formats hours", () => {
    expect(formatDuration(3661)).toBe("1:01:01")
  })
  it("formats 0", () => {
    expect(formatDuration(0)).toBe("00:00")
  })
})

describe("estimateOneRepMax", () => {
  it("returns weight for 1 rep", () => {
    expect(estimateOneRepMax(100, 1)).toBe(100)
  })
  it("estimates correctly for 10 reps at 80kg", () => {
    expect(estimateOneRepMax(80, 10)).toBe(107)
  })
  it("returns 0 for invalid input", () => {
    expect(estimateOneRepMax(0, 10)).toBe(0)
    expect(estimateOneRepMax(80, 0)).toBe(0)
  })
})

describe("calculatePlates", () => {
  it("returns empty for weight equal to barbell", () => {
    expect(calculatePlates(20, 20)).toEqual([])
  })
  it("calculates plates for 100kg", () => {
    const plates = calculatePlates(100, 20)
    // 40kg per side: 25 + 15
    expect(plates).toContainEqual({ weight: 25, count: 1 })
    expect(plates).toContainEqual({ weight: 15, count: 1 })
  })
  it("calculates plates for 60kg", () => {
    const plates = calculatePlates(60, 20)
    // 20kg per side: one 20
    expect(plates).toContainEqual({ weight: 20, count: 1 })
  })
  it("handles 2.5kg plates", () => {
    const plates = calculatePlates(25, 20)
    // 2.5kg per side
    expect(plates).toContainEqual({ weight: 2.5, count: 1 })
  })
})
