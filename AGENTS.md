# SHRED — Agent Instructions

## Mission
SHRED is an offline-first PWA workout tracker for a single user. IndexedDB (Dexie) is the runtime source of truth; Supabase is synced to asynchronously. All features must work fully offline.

## Toolchain
| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (port 3000) |
| `npm test` | Jest test suite (159 tests, 28 suites) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run build` | Production Next.js build |

## Judgment Boundaries
**NEVER:**
- Query Supabase at runtime — sync engine only (`lib/sync.ts`)
- Add global state stores — hooks only
- Push code without green tests + clean typecheck
- Modify seed data in `data/seed-exercises.ts` without updating `docs/data-model.md`

**ASK FIRST:**
- Dexie schema version bumps (breaks existing IndexedDB stores)
- Any change to `lib/sync.ts` or offline queue logic
- New npm dependencies

**ALWAYS:**
- Read `docs/progress.md` before starting work
- TDD: write failing test first, then implementation
- Update `docs/progress.md` + relevant doc after each phase
- Run `npm test && npm run typecheck` before declaring done

## Non-Standard Tooling
- **Dexie v4** — reactive hooks via `useLiveQuery`. Tables: `exercises`, `workout_sessions`, `workout_exercises`, `workout_sets`, `template_*`, `sync_queue`
- **serwist** — service worker via `app/sw.ts` + `public/sw.js`. Registered in `components/register-sw.tsx`
- **`enqueueMutation`** — all write hooks wrap mutations with this for offline queue (in `lib/db.ts`)
- **Single-user auth** — no JWT/session tokens. Cookie set by server action in `app/login/actions.ts`, checked in `middleware.ts`
- **Progression algorithm** — pure function `evaluateProgression` in `lib/progression.ts`; see `docs/progression-algorithm.md`

## Agentic Resources
- `.agents/agents/` — subagent persona definitions
- `.agents/skills/` — reusable task workflows
- `.agents/wiki/architecture.md` — request flow, key patterns, gotchas
- `.agents/wiki/domain.md` — core concepts, data shapes, Dexie schema
