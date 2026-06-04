# SHRED — Routes

| Route | Page | Auth | Status |
|-------|------|------|--------|
| `/login` | LoginPage | No | ✅ Done |
| `/dashboard` | Dashboard (metrics, start workout) | Yes | ✅ Done (Phase 3) |
| `/workout` | Active workout session | Yes | ✅ Done (Phase 2) |
| `/history` | Past sessions + expandable set details | Yes | ✅ Done (Phase 4) |
| `/exercises` | Exercise library CRUD | Yes | ✅ Done (Phase 2) |
| `/guide` | Smart workout plan | Yes | ✅ Done (Phase 7) |

## Middleware (middleware.ts)
Protected routes: /dashboard, /workout, /history, /exercises, /guide, /templates
Checks `shred_session` cookie. Redirects to /login if not present.

## Auth Flow
1. User enters password on /login
2. `loginAction()` server action compares against `AUTH_PASSWORD` env var (server-side)
3. On success: server sets cookie `shred_session=authenticated` (1 day expiry) via `cookies()` API
4. Client also writes `sessionStorage` for `isAuthenticated()` check
5. Middleware checks cookie on protected routes
6. `logout()` clears both cookie and sessionStorage
