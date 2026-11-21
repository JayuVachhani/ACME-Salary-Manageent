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
5. Manage PR creation, actual-code review, approval and merge with GitHub MCP only. Automatic approval/merge is authorized only for the reviewed head after unresolved critical/high issues are closed, required checks verifiably pass and repository policies/permissions allow it. Keep incomplete PRs draft. Do not self-approve when prohibited, bypass independent reviews, force-push, delete branches or bypass protections. Re-review changed heads and use an expected-head merge guard.
6. Never stage actual `.env`, secrets, local PostgreSQL data, dependencies, browser binaries or QA runtime traces. `.env.example` contains non-secret template values only. Run `node acme-salary-app/scripts/verify-staged.mjs` from the repository root before committing.

## Current delivery state

The feature branch is published and [PR #1](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/1) is OPEN, DRAFT and NOT MERGED, targeting `main`. Known application gaps and QA failures are disclosed in its body. Protected `main` contains only the one authorized empty bootstrap commit until review and merge. No CI/deployment pipeline was silently added; deployment/CI remain separately scoped.

## MCP PR review checkpoint — 21 November 2026

- PR: [#1](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/1), `feature/acme-initial-baseline` → `main`; OPEN / DRAFT / NOT APPROVED / NOT MERGED.
- Actual code-review head: `275b352f01a80fba9b10af0973fb2357aaecb1ec`. GitHub MCP returned 75 changed paths. Inspected actual diff and pinned source for salary submission/decision, policy, snapshot access, money/FX, SQL migrations and approval tests, frontend and requirement-entry tests; also read the QA report. This is a checkpoint, not exhaustive approval of all files/lockfile.
- [Review submission](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/1#pullrequestreview-6006259975): COMMENT, review ID `6006259975`, including an inline finding on salary-approval.ts line 74. A comment is not an approving review or independent required review.
- Open P2 code finding: a currency active at request submission can be deactivated before approval. decide() checks the country version but not current currency activity, and SQL foreign keys do not enforce is_active. Add decision-time currency revalidation/locking and an atomic-no-change regression. This is a static code-path finding, not a newly executed reproduction. No untested code fix was published as completed.
- Merge blockers: GitHub combined-status endpoint returned `statuses=[]`; PR-triggered workflow endpoint returned `workflow_runs=[]` for the reviewed head. Required-check configuration is not established by those responses. No passing CI claim is made. Existing QA report still records 14 failed business requirement checks and 45 blocked E2E scenarios; prior local test passes are not substituted for GitHub CI.
- Connected login and PR author are both `JayuVachhani`. No APPROVE/REQUEST_CHANGES, ready-for-review transition, merge or bypass was attempted. An independent required approval cannot be represented by this account's review comment.
- Latest user instruction replaces the earlier blanket prohibition on automatic merging: conditional MCP approval/merge is now authorized only when every gate above is satisfied.
- Policy update committed through GitHub MCP on the same feature branch: `31b1c24f584e67a7059e02628c42cfabec170caf` (`docs: adopt gated MCP-only PR review lifecycle`). Documentation-only content was checked against the user's instruction; no executable test run is claimed for it.
- This ledger update is published through GitHub MCP; its own commit is discoverable from the file history. The earlier local checkout predates these remote documentation commits; fetch/fast-forward before subsequent local work. No local synchronization or successful merge is claimed at this MCP-only checkpoint.
- Next actions: provide executable PR test/check evidence, fix/retest the inactive-currency path and complete the agreed scope or establish an explicit mergeable foundation milestone. Re-review the resulting head through MCP and obtain the independent reviews required by GitHub. Until then the lifecycle is on HOLD, not automatically approved.
