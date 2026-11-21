# ACME project instructions

## Scope and authority

Work only with `https://github.com/JayuVachhani/ACME-Salary-Manageent.git`. Preserve user work. Use the approved development plan, companion requirements and latest decision addenda; never silently invent critical salary, FX, approval, retention or permission rules.

## Git delivery

- Fetch and inspect the remote before starting work. New development branches start from `origin/main` and must begin with `feature/`, `bugfix/` or `chore/`.
- Existing bootstrap/import work is on `feature/acme-initial-baseline`, draft PR #1. If a new module needs dependencies only present in that unmerged PR, identify that dependency rather than silently merging or changing the agreed PR base.
- Commit completed features, logical bug fixes, refactors and important test improvements separately, using clear conventional messages. Include relevant documentation and progress updates.
- Run appropriate tests and `node acme-salary-app/scripts/verify-staged.mjs` before commits/pushes. Test the safety checker with `node acme-salary-app/scripts/test-git-safety.mjs` when changing it.
- Push tested logical changes incrementally, then confirm the remote branch head. Update `GIT_CHANGELOG.md` with hashes, branch, verification and actual push result. Never claim a local commit is pushed without confirmation.
- Use GitHub MCP exclusively for PR creation, actual-code review, approval and merge. Open PRs targeting `main`. Automatic approval/merge is authorized only after the reviewed head has no unresolved critical/high issues, required checks have verified passing results and repository policies permit the action. Never self-approve when prohibited, substitute this account's comment for independent review, force-push, delete branches or bypass protections. The one-time empty-main bootstrap exception has already been used and permits no further direct main pushes.
- Review the actual head SHA with MCP, inspect code/requirements/tests and GitHub check results, fix issues on the same PR branch, then repeat review after updates. Recheck the exact head and checks immediately before approval/merge. Use an expected-head SHA for merge. A missing CI result is not a passing result. Maintain PR links, findings, approval/merge disposition in GIT_CHANGELOG.md; synchronize locally and continue dependent work only after a successful merge.
- Never commit runtime `.env`, credentials, local databases, browser binaries, dependencies, QA traces or real employee data. `.env.example` is a non-secret template.

## Quality and status

The current implementation is incomplete. Chromium audit records 12 passes, 14 failed unmet-requirement checks and 45 blocked workflows. Do not hide/skip these failures or describe the baseline as a completed production system. Backend/domain passes do not substitute for browser E2E. Use synthetic data only and isolated/transactional PostgreSQL tests; do not reset existing data.

`acme-salary-app` contains application commands. `npm run verify:database` runs current lower-level gates; `npm run qa:typecheck` validates browser tests; `npm run qa:e2e` executes actual Chromium and intentionally remains nonzero while required modules are absent. PR #1's explicit foundation acceptance boundary is in `acme-salary-app/docs/PR_1_SCOPE.md`; its CI runs the delivered foundation browser suite without deleting or suppressing future requirement cases. PR-test GitHub Actions is now explicitly authorized; deployment and production infrastructure remain separately scoped.

Latest PR #1 instruction: fix current-feature issues, execute checks, repeat MCP code review and leave the PR ready for an authorized independent reviewer. Do not self-approve or merge during this checkpoint. Existing local passes cannot substitute for a verified current-head GitHub check result.
