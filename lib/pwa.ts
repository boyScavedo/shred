export function registerSW() {
  if (typeof window === "undefined" || process.env.NODE_ENV === "development") return

  const nav = window.navigator as { serviceWorker?: { register: (url: string, opts?: { scope?: string }) => Promise<unknown> } }

  if (nav.serviceWorker) {
    nav.serviceWorker.register("/sw.js", { scope: "/" })
  }
}
