# Skill: add-hook

Add a new Dexie-backed React hook to `lib/hooks/`.

## Steps
1. Read `docs/data-model.md` — confirm table + fields exist
2. Write failing test in `lib/hooks/use-<name>.test.ts`
3. Implement hook in `lib/hooks/use-<name>.ts`:
   - Use `useLiveQuery` for reads
   - Wrap writes with `enqueueMutation`
   - Return `{ data, loading, error }` or mutation fn
4. Run `npm test lib/hooks/use-<name>` — must be green
5. Export from `lib/hooks/index.ts` if it exists
6. Update `docs/progress.md`

## Constraints
- No global state
- No direct Supabase calls
- Types must come from `types/index.ts`
