import "@testing-library/jest-dom"

if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj))
}
