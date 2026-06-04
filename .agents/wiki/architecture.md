# Architecture Wiki

## Request Flow
```
User action
  → React hook (lib/hooks/)
  → Dexie write (IndexedDB) ← source of truth
  → enqueueMutation adds to sync_queue
  → SyncOnMount / online event
  → lib/sync.ts flushes queue → Supabase
```

## Key Patterns

### Offline Writes
All mutations call `enqueueMutation(table, operation, payload)` in `lib/db.ts`.
The queue is flushed by `<SyncOnMount />` on mount and when `navigator.onLine` fires.
Never bypass the queue for "simple" writes — they will be lost offline.

### Reactive Reads
Use `useLiveQuery(() => db.table.toArray(), [deps])` from Dexie.
Returns `undefined` while loading — always handle the loading state.

### Auth
Single-user. Login POSTs password to server action → sets `auth` cookie (HttpOnly).
`middleware.ts` redirects unauthenticated requests to `/login`.
No user ID in data — all data belongs to the one user.

### Progression Algorithm
`evaluateProgression(exercise, sets)` in `lib/progression.ts` is a pure function.
Returns `{ action: 'increase_weight' | 'advance_variation' | 'maintain', ... }`.
Called by the workout completion flow — never called at render time.

## Gotchas
- Dexie `useLiveQuery` returns `undefined` on first render — guard with `?? []`
- `fake-indexeddb` must be imported before Dexie in test files
- serwist service worker only registers in production builds (`NODE_ENV === 'production'`)
- NavBar hides on `/login` via `usePathname()` — new auth pages must start with `/login`
