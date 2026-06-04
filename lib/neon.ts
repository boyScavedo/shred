import { Pool } from "@neondatabase/serverless"

let pool: Pool | null = null

export function getNeonPool(): Pool | null {
  if (pool) return pool
  const url = process.env.DATABASE_URL
  if (!url) return null
  pool = new Pool({ connectionString: url })
  return pool
}
