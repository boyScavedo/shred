import { neon } from "@neondatabase/serverless"

let sql: ReturnType<typeof neon> | null = null

export function getNeon(): ReturnType<typeof neon> | null {
  if (sql) return sql
  const url = process.env.DATABASE_URL
  if (!url) return null
  sql = neon(url)
  return sql
}
