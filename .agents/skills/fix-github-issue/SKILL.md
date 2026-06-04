# Skill: fix-github-issue

Fix a reported bug from a GitHub issue.

## Steps
1. Read `docs/progress.md` for current state
2. Reproduce: locate the failing code path
3. Write a failing test that captures the bug
4. Fix minimum code to make test pass
5. Run `npm test && npm run typecheck` — both green
6. Update `docs/progress.md` if phase-level change
7. Summarize: root cause, fix, test added

## Constraints
- Minimum diff — no opportunistic refactors
- Do not change unrelated tests
