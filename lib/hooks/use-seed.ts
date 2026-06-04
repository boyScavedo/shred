"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { SEED_EXERCISES, SEED_PROGRESSIONS } from "@/data/seed-exercises"

export function useSeedExercises() {
  const [isSeeding, setIsSeeding] = useState(true)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function seed() {
      const count = await db.exercises.count()
      if (count === 0) {
        logger.info("seed", `seeding ${SEED_EXERCISES.length} exercises + ${SEED_PROGRESSIONS.length} progressions`)
        await db.exercises.bulkAdd(SEED_EXERCISES)
        await db.bodyweight_progressions.bulkAdd(SEED_PROGRESSIONS)
        logger.info("seed", "seed complete")
      } else {
        logger.debug("seed", `skip — ${count} exercises already in db`)
      }
      if (!cancelled) {
        setIsSeeding(false)
        setSeeded(true)
      }
    }

    seed()

    return () => {
      cancelled = true
    }
  }, [])

  return { isSeeding, seeded }
}
