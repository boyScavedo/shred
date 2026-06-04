# SHRED — Architecture

## Stack
- **Framework:** Next.js 15 App Router, TypeScript
- **Styling:** Tailwind CSS v4, JetBrains Mono, dark mode only
- **Client DB:** Dexie (IndexedDB) — primary data store
- **Server DB:** Supabase (Postgres) — sync target
- **Auth:** Single user, password from `AUTH_PASSWORD` env var, verified via server action (`app/login/actions.ts`)
- **PWA:** serwist (service worker), Web App Manifest
- **Testing:** Jest + React Testing Library

## Data Flow (Offline-First)
```
User → UI → IndexedDB (always, source of truth)
                ↓
          Sync Engine (when online)
                ↓
          Supabase (persistent storage)
```

All reads/writes go to IndexedDB first. Supabase is a sync target, never queried at runtime during normal operation. The sync engine pushes local changes to Supabase and pulls remote changes when connectivity is available.

## Key Design Decisions
1. **IndexedDB as source of truth** — full offline support by default
2. **No global state store** — hooks encapsulate all state
3. **Mobile-first** — max content width `max-w-lg` (512px)
4. **No code comments** unless explaining non-obvious logic
5. **Tests co-located** — `Component.test.tsx` next to `Component.tsx`

## Seed Data
- 30 exercises + 15 bodyweight progressions defined in `data/seed-exercises.ts`
- `useSeedExercises` hook in `lib/hooks/use-seed.ts` loads seed data on first visit
- `<SeedData />` component (renders nothing) calls the hook in the root layout
- Guard: only seeds if `exercises` table is empty

## Navigation
- `<NavBar />` — fixed bottom tab bar with 5 links: Dashboard, Workout, Templates, Exercises, History
- Client component that auto-hides on `/login` paths via `usePathname()`
- Active route highlighted with accent color `#4f9cf7`
- Root layout wraps `<NavBar />` and adds `pb-20` padding to `<main>` to prevent overlap

## Dashboard
- `useWorkoutStats` hook in `lib/hooks/use-stats.ts` computes aggregated metrics from IndexedDB:
  - `weeklyWorkoutCount` — completed sessions in last 7 days
  - `weeklyVolume` — sum of (`reps × weight_kg`) for completed sets this week
  - `currentStreak` — consecutive days with at least one completed workout
  - `recentSessions` — last 5 completed sessions, newest first
- `/dashboard` page shows stats cards, quick-start button, and recent sessions list

## History
- `useCompletedSessions` hook in `lib/hooks/use-history.ts` returns all completed sessions sorted newest-first
- `/history` page shows session list with date and duration
- Each session card expands inline to show exercises, sets (reps/weight/duration/RPE), and completion status
- Empty state shown when no completed sessions exist

## Set Logging
- `useAddExerciseToWorkout` auto-generates N empty `WorkoutSet` records based on `exercise.default_sets` when adding an exercise
- `useAddSet` creates an extra set with auto-incremented `set_number`
- `<ExerciseBlock />` component renders an expandable card per exercise with per-set inputs:
  - Reps or duration input (based on `load_type`)
  - Weight input (hidden for bodyweight exercises via `prescription_mode`)
  - RPE selector (6–10 from `RPE_SCALE`)
  - Completion checkbox
- `<SetRow />` sub-component renders individual set controls
