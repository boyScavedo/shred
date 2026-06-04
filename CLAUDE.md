# SHRED — Claude Instructions

## Stack
| Layer | Tech |
|---|---|
| Framework | Next.js 16 App Router, TypeScript 5 |
| Styling | Tailwind CSS v4, JetBrains Mono, dark-mode only |
| Client DB | Dexie (IndexedDB) — source of truth |
| Server DB | Supabase (Postgres) — sync target only |
| Auth | Single-user, `AUTH_PASSWORD` env var, server action |
| PWA | serwist (service worker + manifest) |
| Tests | Jest 30 + React Testing Library |

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm test` | Run all tests |
| `npm run test:watch` | Watch mode |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## Project Layout
```
app/          Next.js App Router pages + layouts
components/   Shared UI components (co-located .test.tsx files)
lib/          Business logic: hooks/, auth, db, sync, progression
data/         Static seed data (exercises, progressions)
types/        Shared TypeScript types
docs/         Architecture, data model, routes, algorithms, sync
.agents/      Subagent definitions, skills, wiki
.claude/      Claude-specific agents and skills
```

## Judgment Boundaries
**NEVER:**
- Write to Supabase directly at runtime (sync engine only)
- Add global state stores (all state via hooks)
- Skip tests — TDD: red → green → refactor
- Modify `docs/` without updating after code changes

**ASK FIRST:**
- Schema changes to Dexie `db.ts` (affects sync + migration)
- Changes to `lib/sync.ts` or `middleware.ts`
- Adding new npm dependencies

**ALWAYS:**
- Read `docs/progress.md` before starting any task
- Run `npm test` after every change
- Co-locate test files: `Foo.test.tsx` next to `Foo.tsx`
- Update relevant `docs/` file after each phase

## Conventions
- `@/` alias maps to project root
- `max-w-lg` (512px) cap — mobile-first, no desktop breakpoints needed
- Hooks return `{ data, loading, error }` or mutation function
- `enqueueMutation` wraps all write hooks for offline queue
- No code comments unless explaining non-obvious logic

## Agentic Config
- Subagent personas: `.agents/agents/`
- Reusable workflows: `.agents/skills/`
- Domain knowledge: `.agents/wiki/`
- Claude-specific agents: `.claude/agents/`

@AGENTS.md
