type Level = "debug" | "info" | "warn" | "error"

const COLORS: Record<Level, string> = {
  debug: "#666",
  info:  "#4f9cf7",
  warn:  "#f59e0b",
  error: "#ef4444",
}

function log(level: Level, module: string, msg: string, data?: unknown) {
  if (typeof window === "undefined") return
  const style = `color:${COLORS[level]};font-weight:bold`
  const prefix = `%c[${level.toUpperCase()}] [${module}]`
  if (data !== undefined) {
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
