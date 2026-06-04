# SHRED — Progress

## Current State (Phase 8 complete)

159 tests passing across 28 test suites, all green. `tsc --noEmit` clean.

## What's Built

### Phase 1 — Seed Loading
- `lib/hooks/use-seed.ts` — `useSeedExercises` hook loads `SEED_EXERCISES` (30) + `SEED_PROGRESSIONS` (15) on first visit
- `components/seed-data.tsx` — client wrapper, renders nothing, called in root layout
- Guard: only seeds if `exercises` table is empty

### Phase 2 — Set Logging UI
- `lib/hooks/use-workout.ts` — extended `useAddExerciseToWorkout` to auto-create empty sets; added `useAddSet` hook
- `components/exercise-block.tsx` — `ExerciseBlock` + `SetRow` sub-component:
  - Reps or duration input (based on `load_type`)
  - Weight input (hidden for bodyweight exercises via `prescription_mode`)
  - RPE selector (6–10 from `RPE_SCALE`)
  - Completion checkbox
  - "+ Add Set" button
- Wired into `app/workout/page.tsx` via `WorkoutExerciseBlock` sub-component

### Phase 3 — Dashboard + Navigation
- `components/nav-bar.tsx` — fixed bottom tab bar: Dashboard, Workout, Templates, Exercises, History; hides on `/login`
- `lib/hooks/use-stats.ts` — `useWorkoutStats` hook:
  - `weeklyWorkoutCount` — completed sessions in last 7 days
  - `weeklyVolume` — sum of (reps × weight_kg) for completed sets this week
  - `currentStreak` — consecutive days with at least one completed workout
  - `recentSessions` — last 5 completed sessions, newest first
- `app/dashboard/page.tsx` — stats cards, Start/Continue Workout button, recent sessions list
- `app/layout.tsx` — added `<NavBar />` + `pb-20` padding

### Phase 4 — History
- `lib/hooks/use-history.ts` — `useCompletedSessions` hook: all completed sessions sorted newest-first
- `app/history/page.tsx` — session list with expandable cards showing exercises + sets

### Phase 5 — Templates (Full CRUD)
- `lib/hooks/use-templates.ts` — 10 hooks all wired with `enqueueMutation`:
  - `useTemplates` — list all templates sorted by created_at desc
  - `useTemplate(id)` — get single template by id
  - `useTemplateExercises(templateId)` — get exercises for a template in sort_order
  - `useCreateTemplate` — create template with name/description
  - `useUpdateTemplate` — update template name/description
  - `useDeleteTemplate` — delete template + cascade delete its template_exercises
  - `useAddTemplateExercise` — add exercise to template with auto sort_order + defaults
  - `useRemoveTemplateExercise` — remove exercise from template
  - `useUpdateTemplateExercise` — update target_sets/reps/weight/rest
  - `useStartWorkoutFromTemplate` — create session + workout_exercises + empty sets from template
- `app/templates/page.tsx` — template list with exercise count, click to detail, create button
- `app/templates/new/page.tsx` — create form (name, description, exercise picker)
- `app/templates/[id]/page.tsx` — detail view (exercises list, remove, start workout, delete)
- `app/templates/[id]/add-exercises/page.tsx` — add more exercises to existing template
- NavBar updated: added "Templates" tab (5 items total)
- Middleware updated: `/templates/:path*` protected

### Phase 6 — Progression Algorithm
- `lib/progression.ts` — pure function `evaluateProgression`:
  - `increase_weight` when all sets hit max reps: +2.5kg (barbell/dumbbell) or +1kg (weighted bodyweight)
  - `advance_variation` when bodyweight hits max reps and next progression exists
  - `maintain` otherwise, with descriptive reason
  - Handles: no data, mixed reps, below-min reps, duration exercises
- `lib/hooks/use-progression.ts` — `useProgression(exerciseId)` hook:
  - Finds most recent completed session with the exercise
  - Fetches completed sets + bodyweight progression chain
  - Calls `evaluateProgression`, returns decision
- `components/exercise-block.tsx` — added `progression` prop, renders colored hint text
- `app/workout/page.tsx` — passes progression decision to `ExerciseBlock`

### Phase 7 — Smart Guide (`/guide`)
- `lib/guide.ts` — pure function `generateWeeklyPlan`:
  - `GuideInput`: exercises + recent completed session info
  - Groups exercises by movement pattern (push/pull/squat/hinge/core)
  - Generates 6-day PPL schedule (Push+Core Mon/Thu, Pull+Core Tue/Fri, Legs Wed/Sat)
  - Applies 48h recovery enforcement per muscle group
  - Output: `WeeklyPlanDay[]` with `GuideExercise[]` per day
- `lib/hooks/use-guide.ts` — `useGuide()` hook:
  - Fetches all exercises and completed sessions from IndexedDB
  - Builds recent session info (which muscle groups were trained)
  - Calls `generateWeeklyPlan`, returns plan
- `app/guide/page.tsx` — displays weekly plan with:
  - Day name + label (e.g., "Monday — Push + Core")
  - Exercise list with target sets/reps
  - Muscle group tags (filtered for recovery)
  - Recovery indicator when groups are skipped

### Phase 8 — Sync Prep (all hooks wired)
- `lib/supabase.ts` — rewritten as `getSupabase()` function, returns null if no creds
- `lib/sync.ts` — sync engine:
  - `enqueueMutation(input)` — writes to `sync_queue` Dexie table
  - `processSyncQueue()` — processes FIFO with 5 retry max
  - `syncAllLocalToRemote()` — bulk upsert all local data
- `lib/hooks/use-sync.ts` — hooks:
  - `useSyncStatus()` — isSyncing/error/lastSyncedAt state + sync trigger
  - `useSyncOnMount()` — runs sync once on component mount
  - `useSyncQueueSize()` — polls queue size every 10s
- `components/sync-on-mount.tsx` — calls `useSyncOnMount`, renders null
- `components/offline-banner.tsx` — updated: shows pending count when online, offline message when offline
- `lib/hooks/use-workout.ts` — all 6 mutation hooks call `enqueueMutation`
- `lib/hooks/use-templates.ts` — all 10 mutation hooks call `enqueueMutation`
- `lib/hooks/use-exercises.ts` — all 3 mutation hooks call `enqueueMutation`

### Working Routes
| Route | Page | Status |
|-------|------|--------|
| `/login` | LoginPage | ✅ Done |
| `/dashboard` | Dashboard (stats, start workout) | ✅ Done |
| `/workout` | Active workout session with set logging | ✅ Done |
| `/exercises` | Exercise library with filters | ✅ Done |
| `/history` | Past sessions with expandable details | ✅ Done |
| `/templates` | Template list | ✅ Done |
| `/templates/new` | Create template | ✅ Done |
| `/templates/[id]` | Template detail (start workout, manage exercises) | ✅ Done |
| `/templates/[id]/add-exercises` | Add exercises to template | ✅ Done |
| `/guide` | Smart weekly training plan | ✅ Done |

## File Inventory

### lib/
| File | Purpose |
|------|---------|
| `sync.ts` | Sync engine: enqueueMutation, processSyncQueue, syncAllLocalToRemote |
| `supabase.ts` | Supabase client (returns null if no creds) |
| `guide.ts` | Pure function: generate weekly plan with recovery enforcement |
| `progression.ts` | Pure function: double progression + bodyweight advancement algorithm |
| `db.ts` | Dexie schema: 8 tables + sync_queue (9th), version 1 |
| `auth.ts` | Logout/isAuthenticated/requireAuth via sessionStorage (login moved to server action) |
| `env.ts` | Reads `AUTH_PASSWORD` or `NEXT_PUBLIC_AUTH_PASSWORD` |
| `pwa.ts` | Service worker registration |
| `hooks/use-workout.ts` | 9 hooks: active, start, complete, exercises, sets, add/remove exercise, update/add set — all wired |
| `hooks/use-templates.ts` | 10 hooks: list, get, exercises, CRUD, start workout from template — all wired |
| `hooks/use-sync.ts` | 3 hooks: useSyncStatus, useSyncOnMount, useSyncQueueSize |
| `hooks/use-progression.ts` | 1 hook: evaluate progression for an exercise |
| `hooks/use-guide.ts` | 1 hook: generate weekly training plan |
| `hooks/use-exercises.ts` | 5 hooks: list (filters), get, add, update, delete — all wired |
| `hooks/use-seed.ts` | 1 hook: seed exercises on first visit |
| `hooks/use-stats.ts` | 1 hook: weekly count/volume/streak/recent |
| `hooks/use-history.ts` | 1 hook: all completed sessions |

### components/
| File | Purpose |
|------|---------|
| `offline-banner.tsx` | Shows pending sync count or offline warning |
| `sync-on-mount.tsx` | Triggers sync on mount, renders null |
| `register-sw.tsx` | Registers service worker |
| `seed-data.tsx` | Triggers seed hook in layout |
| `nav-bar.tsx` | Bottom tab navigation (5 tabs) |
| `exercise-block.tsx` | Exercise card with per-set controls |

### Types & Data
| File | Purpose |
|------|---------|
| `types/index.ts` | All interfaces + RPE_SCALE constant + updated_at on data entities |
| `data/seed-exercises.ts` | 30 exercises + 15 bodyweight progressions |

### Pages (app/)
| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout (dark theme, JetBrains Mono, NavBar, seed, offline banner, sync-on-mount, SW) |
| `page.tsx` | Redirects to /dashboard |
| `login/page.tsx` | Password form, calls server action for verification |
| `login/actions.ts` | Server action: verifies password, sets cookie via `cookies()` API |
| `dashboard/page.tsx` | Stats cards, start workout, recent sessions |
| `workout/page.tsx` | Active workout with ExerciseBlock per exercise |
| `exercises/page.tsx` | Filterable exercise library |
| `history/page.tsx` | Past sessions with expandable details |
| `templates/page.tsx` | Template list with create button |
| `templates/new/page.tsx` | Create template form |
| `templates/[id]/page.tsx` | Template detail, start workout, manage exercises |
| `templates/[id]/add-exercises/page.tsx` | Add exercises to template |
| `guide/page.tsx` | Smart weekly training plan | ✅ Done |
| `sw.ts` | Serwist service worker |

### Config
| File | Purpose |
|------|---------|
| `middleware.ts` | Protects /dashboard, /workout, /history, /exercises, /guide, /templates |
| `next.config.ts` | Serwist PWA integration |
| `jest.config.ts` | Jest + next/jest, jsdom |
| `jest.setup.ts` | jest-dom matchers, structuredClone polyfill |
| `tsconfig.json` | Strict, bundler module resolution, @/ alias |

## Key Conventions
- TDD: Red (failing test) → Green (minimum code) → Refactor
- Tests co-located next to source files
- No code comments unless explaining non-obvious logic
- Mobile-first: `max-w-lg` (512px), `pb-20` for nav bar
- All state via hooks, no global stores
- `@/` maps to project root
- Sync queue-based: mutations write to sync_queue, processed FIFO with 5 retry max

## Commands
- `npm run dev` — start dev server
- `npm test` — run all tests
- `npm run typecheck` — TypeScript check
- `npm run build` — production build (currently fails due to Next.js 16 Turbopack + Serwist incompatibility — pre-existing)

### Phase 9 — Intelligence Layer + Workout UX

#### Build fixes
- Renamed `middleware.ts` → `proxy.ts` (Next.js 16 deprecation)
- Added `turbopack: { root: __dirname }` to `next.config.ts`
- Fixed `isAuthenticated()` bug: was reading `sessionStorage`, now reads `document.cookie`
- Fixed `useWorkoutSets` reactivity: replaced one-shot fetch with `liveQuery` subscription — checkboxes and reps now update live

#### User Profile (new)
- `types/index.ts` — `UserProfile`, `FitnessGoal`, `BodyGoal`, `ExperienceLevel` types
- `lib/db.ts` — bumped to version 2, added `user_profile` table (single row, id="profile")
- `lib/hooks/use-user-profile.ts` — `useUserProfile`, `useUpdateUserProfile`, `useEnsureProfile` hooks (liveQuery-based)
- `app/profile/page.tsx` — goal wizard: training goal, body goal, experience, days/week, equipment, bodyweight

#### Plan Analyzer (new)
- `lib/plan-analyzer.ts` — pure function `analyzePlan()`: checks volume adequacy, push/pull ratio, compound ratio, rep range alignment, cut/bulk-specific rules, muscle imbalances. Returns score 0–100, grade A–F, issues with severity, suggestions
- `lib/plan-analyzer.test.ts` — 11 tests

#### Recommendations Engine (new)
- `lib/recommendations.ts` — pure functions: `selectSplit()` (full body/upper-lower/PPL/PPL×2 based on days+experience), `generateRecommendation()` (equipment-filtered exercise list, goal-specific tips, weekly checklist, cut/bulk adjustments)
- `lib/recommendations.test.ts` — 12 tests
- `lib/hooks/use-recommendations.ts` — hook wiring profile + exercises → recommendation
- `app/recommendations/page.tsx` — split card, exercise list by priority, cut/bulk adjustments, weekly checklist, tips

#### Template Analysis (new)
- `app/templates/[id]/analyze/page.tsx` — plan scorecard (SVG ring), grade, metrics table, issue list with severity, volume-by-muscle bar chart, suggestions
- "Analyze Plan →" button added to template detail page

#### Workout Session UX (enhanced)
- `lib/workout-timer.ts` — `formatDuration`, `estimateOneRepMax` (Epley), `calculatePlates` (per-side plate breakdown)
- `lib/workout-timer.test.ts` — 11 tests
- `lib/hooks/use-previous-performance.ts` — `usePreviousPerformance` (last session ghost values), `usePersonalRecord` (all-time best e1RM)
- `components/rest-timer.tsx` — full-screen rest timer: auto-starts on set completion, countdown with progress bar, pause/resume, +15s/−15s, quick-set (1/1.5/2/3/5min), vibrate on complete
- `components/exercise-block.tsx` — rewritten: ghost values as input placeholders, PR badge on new personal record, inline e1RM estimate, green row highlight on completed set
- `app/workout/page.tsx` — elapsed timer in header, rest timer triggers on set complete, exercise search in add-modal, rest duration from user profile goal

#### Navigation
- `components/nav-bar.tsx` — updated: Home/Workout/Plan/Programs/History (5 tabs, removed Exercises from primary nav, added Recommendations as "Plan")
- `proxy.ts` — added `/recommendations` and `/profile` to protected routes + matcher

## Sync Status (2026-06-03)
- Supabase client now configured with `db: { schema: "shred" }` in `lib/supabase.ts:18` — all queries go to the `shred` schema.
- Removed `shred.` prefix from table names in `lib/sync.ts` — schema is set at the client level.
- `syncAllLocalToRemote` now includes `user_profile` table.
- All hooks log via `lib/logger.ts` — check browser console for `[SYNC]` messages.
- **Known**: 27 items stuck in queue from prior retry exhaustion. Need to reset `retry_count` or clear them to re-process.

## Test Status
198 tests passing across 32 test suites. `tsc --noEmit` clean.

## Next Steps
- Build integration test for end-to-end sync flow
- Implement pull-from-remote for multi-device support
- Background Sync API registration for automatic offline sync
- Volume/strength charts (SVG, no library) per exercise over time
- Session notes + exercise notes during workout
- Superset support (link two exercises, shared rest timer)
- Plate calculator UI in workout (tap weight → see plate breakdown)
