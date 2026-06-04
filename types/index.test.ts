import { RPE_SCALE } from "./index"

describe("RPE_SCALE", () => {
  it("starts at 6", () => {
    expect(RPE_SCALE[0].value).toBe(6)
  })

  it("includes all values 6-10 in order", () => {
    expect(RPE_SCALE.map((r) => r.value)).toEqual([6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10])
  })

  it("each entry has required fields", () => {
    for (const r of RPE_SCALE) {
      expect(r.label).toBeDefined()
      expect(r.rir).toBeDefined()
      expect(r.description).toBeDefined()
    }
  })

  it("every RPE has a unique value", () => {
    const values = RPE_SCALE.map((r) => r.value)
    expect(new Set(values).size).toBe(values.length)
  })
})
