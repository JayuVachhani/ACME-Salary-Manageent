# ACME Git change ledger

Repository: https://github.com/JayuVachhani/ACME-Salary-Manageent  
Started: 21 November 2026 (Asia/Calcutta).

## Confirmed history

| Change | Commit | Branch | Verification | Remote status |
|---|---|---|---|---|
| One-time empty bootstrap, explicitly approved by client | `d7da0c84e10ef4f3aa961c97ddc532a679957f0d` | `main` | Empty tree; authorized remote previously had no branches | Pushed successfully |
| Import pre-Git, in-progress application and requirements | `4696cf4a500775f168e2ca084262d418c36016c5` | `feature/acme-initial-baseline` | `verify:database` passed: 18 unit tests, 62 PostgreSQL checks, Prisma and health smoke, lint/type/build; `qa:typecheck` passed; 70 indexed files scanned | Pushed successfully |
| Staged-file safety tooling, synthetic safety tests, PR template and ledger | `8015e9316ccc66ef1994b77805872a29b92c618d` | `feature/acme-initial-baseline` | Safety tests passed (source/template allowed; runtime env and known synthetic credentials rejected; secret values withheld); full 74-file index scan passed | Pushed successfully |

The imported baseline is not a completed feature or production release. Existing QA records show 12 Chromium passes, 14 unmet-requirement failures and 45 blocked workflows. The three frontend fixes and domain implementations predate Git and are included in that honest baseline, rather than reconstructed as fabricated historical commits. No new feature/fix work is represented as accepted through this import.

## Ledger synchronization

The workflow improvement above was separately committed and pushed after its tests passed. This documentation-only synchronization records its confirmed hash and the draft PR. No recursive claim is made about a commit embedding its own hash; use `git log -- GIT_CHANGELOG.md` for ledger-maintenance history and `git status -sb` / `git ls-remote origin refs/heads/feature/acme-initial-baseline` to verify the current synchronization commit's remote state.

## Rules for all subsequent work

1. Work only on this ACME remote. Fetch before starting; branch from `origin/main` using `feature/<name>`, `bugfix/<name>`, or `chore/<name>`.
2. Keep each completed feature, logical fix, refactor and important test improvement in a meaningful separate commit. Include associated requirement/progress documentation.
3. Run relevant tests and staged-file safety checks before each push. Record actual failures and blocked work; do not label incomplete modules as completed.
4. Push the verified logical commit to its branch; verify remote head SHA, then record commit, tests, branch and push result here. A local commit is not evidence of a successful push.
5. Open a PR to `main`; keep it draft while incomplete. Required reviews and branch protections still apply. Do not merge automatically, force-push, delete branches or bypass hooks/protection.
6. Never stage actual `.env`, secrets, local PostgreSQL data, dependencies, browser binaries or QA runtime traces. `.env.example` contains non-secret template values only. Run `node acme-salary-app/scripts/verify-staged.mjs` from the repository root before committing.

## Current delivery state

The feature branch is published and [PR #1](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/1) is OPEN, DRAFT and NOT MERGED, targeting `main`. Known application gaps and QA failures are disclosed in its body. Protected `main` contains only the one authorized empty bootstrap commit until review and merge. No CI/deployment pipeline was silently added; deployment/CI remain separately scoped.
