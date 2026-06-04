# SHRED — Offline Sync

## Architecture
```
IndexedDB (Dexie) — SOURCE OF TRUTH (always)
Supabase — SYNC TARGET (when online)
```

## Sync Triggers
- App opens → full sync
- Document becomes visible (tab switch) → sync
- Browser fires 'online' → sync
- Background Sync API (service worker retries)

## Sync Flow
1. All reads/writes hit IndexedDB first
2. Mutations are queued in `sync_queue` table
3. Sync engine processes queue when online
4. Conflict resolution: Last-Write-Wins by `updated_at`

## Queue Schema (SyncQueueItem)
```
id, table_name, operation (insert|update|delete), record_id, payload, retry_count, created_at
```

## Status
🔄 Supabase client configured in lib/supabase.ts (warns if no creds)
⚠️ Sync engine not yet implemented — planned for Phase 6
