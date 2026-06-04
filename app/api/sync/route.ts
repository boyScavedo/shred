import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getNeonPool } from "@/lib/neon"

const ALLOWED_TABLES = new Set([
  "exercises",
  "bodyweight_progressions",
  "workout_sessions",
  "workout_exercises",
  "workout_sets",
  "exercise_templates",
  "template_exercises",
  "user_profile",
])

interface SyncItem {
  id: string
  table_name: string
  operation: "insert" | "update" | "delete"
  record_id: string
  payload: Record<string, unknown>
}

interface ItemResult {
  id: string
  success: boolean
  error?: string
}

async function processItem(item: SyncItem): Promise<ItemResult> {
  const pool = getNeonPool()
  if (!pool) return { id: item.id, success: false, error: "no DATABASE_URL" }
  if (!ALLOWED_TABLES.has(item.table_name)) {
    return { id: item.id, success: false, error: `table not allowed: ${item.table_name}` }
  }

  const client = await pool.connect()
  try {
    if (item.operation === "delete") {
      await client.query(`DELETE FROM ${item.table_name} WHERE id = $1`, [item.record_id])
    } else {
      const cols = Object.keys(item.payload)
      const vals = Object.values(item.payload)
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ")
      const updates = cols
        .filter((c) => c !== "id")
        .map((c) => `${c} = EXCLUDED.${c}`)
        .join(", ")
      const q = `INSERT INTO ${item.table_name} (${cols.join(", ")}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updates}`
      await client.query(q, vals)
    }
    return { id: item.id, success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { id: item.id, success: false, error: msg }
  } finally {
    client.release()
  }
}

export async function POST(request: NextRequest) {
  const jar = await cookies()
  const session = jar.get("shred_session")
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const items: SyncItem[] = body.items ?? []
  const results: ItemResult[] = await Promise.all(items.map(processItem))

  return NextResponse.json({ results })
}
