import { NextRequest, NextResponse } from "next/server"
import { cookies, headers } from "next/headers"
import { getNeon, type NeonQueryFn } from "@/lib/neon"
import { verifySession, getAuthSecret } from "@/lib/session"

const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean) as string[])

const TABLE_COLUMNS: Record<string, readonly string[]> = {
  exercises: [
    "id", "name", "mechanics", "movement_pattern", "resistance_type", "load_type",
    "muscle_group_primary", "muscle_group_secondary", "prescription_mode",
    "default_sets", "default_reps_min", "default_reps_max", "default_duration_secs",
    "bodyweight_progression_id", "equipment_required", "created_at", "updated_at",
  ],
  bodyweight_progressions: ["id", "exercise_id", "variation_name", "sort_order"],
  workout_sessions: [
    "id", "started_at", "completed_at", "duration_secs",
    "pre_workout_calories", "calories_burned_estimate", "notes", "updated_at",
  ],
  workout_exercises: ["id", "session_id", "exercise_id", "sort_order", "notes", "updated_at"],
  workout_sets: [
    "id", "workout_exercise_id", "set_number", "reps", "weight_kg",
    "duration_secs", "rpe", "completed", "completed_at", "updated_at",
  ],
  exercise_templates: ["id", "name", "description", "created_at", "updated_at"],
  template_exercises: [
    "id", "template_id", "exercise_id", "sort_order", "target_sets",
    "target_reps_min", "target_reps_max", "target_weight_kg",
    "rest_secs", "rest_after_exercise_secs", "updated_at",
  ],
  user_profile: [
    "id", "goal", "body_goal", "experience", "days_per_week",
    "equipment", "bodyweight_kg", "target_bodyweight_kg", "updated_at",
  ],
}

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
  const sql: NeonQueryFn | null = getNeon()
  if (!sql) return { id: item.id, success: false, error: "no DATABASE_URL" }

  const allowedCols = TABLE_COLUMNS[item.table_name]
  if (!allowedCols) {
    return { id: item.id, success: false, error: `table not allowed: ${item.table_name}` }
  }

  try {
    if (item.operation === "delete") {
      await sql(`DELETE FROM ${item.table_name} WHERE id = $1`, [item.record_id])
    } else {
      // Only keep columns that are in the whitelist
      const cols = Object.keys(item.payload).filter((c) => allowedCols.includes(c))
      const vals = cols.map((c) => item.payload[c])

      if (cols.length === 0) {
        return { id: item.id, success: false, error: "no valid columns in payload" }
      }

      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ")
      const updates = cols
        .filter((c) => c !== "id")
        .map((c) => `${c} = EXCLUDED.${c}`)
        .join(", ")
      const q = `INSERT INTO ${item.table_name} (${cols.join(", ")}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updates}`
      await sql(q, vals)
    }
    return { id: item.id, success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { id: item.id, success: false, error: msg }
  }
}

export async function POST(request: NextRequest) {
  // CSRF: reject cross-origin requests
  const h = await headers()
  const origin = h.get("origin") ?? ""
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const jar = await cookies()
  const session = jar.get("shred_session")
  let secret: string
  try {
    secret = getAuthSecret()
  } catch {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 })
  }
  if (!session || !verifySession(session.value, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const items: SyncItem[] = body.items ?? []
  const results: ItemResult[] = await Promise.all(items.map(processItem))

  return NextResponse.json({ results })
}
