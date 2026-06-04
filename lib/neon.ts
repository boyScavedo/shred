import { neon } from "@neondatabase/serverless"

export type NeonQueryFn = (query: string, params?: unknown[]) => Promise<unknown[]>

let _query: NeonQueryFn | null = null

export function getNeon(): NeonQueryFn | null {
  if (_query) return _query
  const url = process.env.DATABASE_URL
  if (!url) return null
  const sql = neon(url)
  _query = (query, params) => sql.query(query, params) as Promise<unknown[]>
  return _query
}
