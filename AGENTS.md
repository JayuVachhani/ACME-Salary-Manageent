# ACME project instructions

## Scope and authority

Work only with `https://github.com/JayuVachhani/ACME-Salary-Manageent.git`. Preserve user work. Use the approved development plan, companion requirements and latest decision addenda; never silently invent critical salary, FX, approval, retention or permission rules.

## Git delivery

- Fetch and inspect the remote before starting work. New development branches start from `origin/main` and must begin with `feature/`, `bugfix/` or `chore/`.
- Existing bootstrap/import work is on `feature/acme-initial-baseline`, draft PR #1. If a new module needs dependencies only present in that unmerged PR, identify that dependency rather than silently merging or changing the agreed PR base.
- Commit completed features, logical bug fixes, refactors and important test improvements separately, using clear conventional messages. Include relevant documentation and progress updates.
- Run appropriate tests and `node acme-salary-app/scripts/verify-staged.mjs` before commits/pushes. Test the safety checker with `node acme-salary-app/scripts/test-git-safety.mjs` when changing it.
- Push tested logical changes incrementally, then confirm the remote branch head. Update `GIT_CHANGELOG.md` with hashes, branch, verification and actual push result. Never claim a local commit is pushed without confirmation.
- Open a PR targeting `main`. Preserve required reviews; never force-push, delete branches, bypass protections or merge automatically. The client's one-time exception for an empty initial main commit has already been used; it does not authorize further direct main pushes.
- Never commit runtime `.env`, credentials, local databases, browser binaries, dependencies, QA traces or real employee data. `.env.example` is a non-secret template.

## Quality and status

The current implementation is incomplete. Chromium audit records 12 passes, 14 failed unmet-requirement checks and 45 blocked workflows. Do not hide/skip these failures or describe the baseline as a completed production system. Backend/domain passes do not substitute for browser E2E. Use synthetic data only and isolated/transactional PostgreSQL tests; do not reset existing data.

`acme-salary-app` contains application commands. `npm run verify:database` runs current lower-level gates; `npm run qa:typecheck` validates browser tests; `npm run qa:e2e` executes actual Chromium and intentionally remains nonzero while required modules are absent. Keep incomplete work clearly labeled in draft PRs rather than presented as completed features. Deployment/CI/infrastructure remain separately scoped.
