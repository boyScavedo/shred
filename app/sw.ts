import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry } from "serwist"
import { Serwist } from "serwist"

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST as PrecacheEntry[],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
