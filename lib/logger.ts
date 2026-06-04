type Level = "debug" | "info" | "warn" | "error"

const COLORS: Record<Level, string> = {
  debug: "#666",
  info:  "#4f9cf7",
  warn:  "#f59e0b",
  error: "#ef4444",
}

const IS_PROD = process.env.NODE_ENV === "production"
// In production only errors are shown — no info/debug leaking sync internals
const ENABLED_LEVELS: Set<Level> = IS_PROD
  ? new Set(["error"])
  : new Set(["debug", "info", "warn", "error"])

function log(level: Level, module: string, msg: string, data?: unknown) {
  if (typeof window === "undefined") return
  if (!ENABLED_LEVELS.has(level)) return
  const style = `color:${COLORS[level]};font-weight:bold`
  const prefix = `%c[${level.toUpperCase()}] [${module}]`
  // In production, strip raw data from logs to avoid leaking DB internals
  if (data !== undefined && !IS_PROD) {
    console[level === "debug" ? "log" : level](prefix, style, msg, data)
  } else {
    console[level === "debug" ? "log" : level](prefix, style, msg)
  }
}

export const logger = {
  debug: (module: string, msg: string, data?: unknown) => log("debug", module, msg, data),
  info:  (module: string, msg: string, data?: unknown) => log("info",  module, msg, data),
  warn:  (module: string, msg: string, data?: unknown) => log("warn",  module, msg, data),
  error: (module: string, msg: string, data?: unknown) => log("error", module, msg, data),
}
