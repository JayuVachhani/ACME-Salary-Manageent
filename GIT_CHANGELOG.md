# ACME Git change ledger

Repository: https://github.com/JayuVachhani/ACME-Salary-Manageent  
Started: 21 November 2026 (Asia/Calcutta).

## Confirmed history

| Change | Commit | Branch | Verification | Remote status |
|---|---|---|---|---|
| One-time empty bootstrap, explicitly approved by client | `d7da0c84e10ef4f3aa961c97ddc532a679957f0d` | `main` | Empty tree; authorized remote previously had no branches | Pushed successfully |
| Import pre-Git, in-progress application and requirements | `4696cf4a500775f168e2ca084262d418c36016c5` | `feature/acme-initial-baseline` | `verify:database` passed: 18 unit tests, 62 PostgreSQL checks, Prisma and health smoke, lint/type/build; `qa:typecheck` passed; 70 indexed files scanned | Pushed successfully |
| Staged-file safety tooling, synthetic safety tests, PR template and ledger | `8015e9316ccc66ef1994b77805872a29b92c618d` | `feature/acme-initial-baseline` | Safety tests passed (source/template allowed; runtime env and known synthetic credentials rejected; secret values withheld); full 74-file index scan passed | Pushed successfully |
| Approval-time active-currency validation and SQL guard | `7a4cfa5f1ba5569752cb31cdf6aef204ffb2e3d5` | `feature/acme-initial-baseline` | Regression failed before fix; complete database gate passed after fix: 18 unit, 72 PostgreSQL checks including 38 approvals, Prisma, health, lint/type/build | Pushed successfully |
| PR validation Actions and explicit foundation acceptance boundary | `4fb1fd3d0b52f02170f33a7c0e25242ec9cd8889` | `feature/acme-initial-baseline` | YAML parsed; QA typing and 12 local foundation Chromium tests passed; GitHub Foundation integrity run 44920102845 succeeded on this head | Pushed successfully |

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

The feature branch is published and [PR #1](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/1) is OPEN, READY FOR INDEPENDENT REVIEW and NOT MERGED, targeting `main`. The agent has not approved it. Known future application gaps are disclosed and scoped in `acme-salary-app/docs/PR_1_SCOPE.md`. PR-test Actions is explicitly authorized and implemented; deployment/production infrastructure remain separate. Protected `main` still contains only the authorized empty bootstrap commit.

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

## Currency fix, CI and independent-review handoff — 21 November 2026

- Client authorized fixing the finding on the same PR branch, regression tests, PR-triggered GitHub Actions, a blocking/future gap assessment, MCP re-review and independent review. No self-approval or merge was requested for this checkpoint.
- Currency finding FIXED: service and migration 006 use approval-time active-currency checks and shared row locking. Ten added regression checks cover direct SQL protection, unchanged pending/ledger/history/audit/version state, concurrent deactivation, rejection and reactivation. The regression was executed on old code and failed before the fix; full local gate passed after it.
- CI: [run 44920102845](https://github.com/JayuVachhani/ACME-Salary-Manageent/actions/runs/44920102845), head `4fb1fd3d0b52f02170f33a7c0e25242ec9cd8889`, job `136894051358`, **SUCCESS**, verified using GitHub MCP job status and logs. Logs confirm 18 unit tests, 72 logical PostgreSQL checks (11 + 23 + 38), Prisma/health and 12 foundation Chromium tests, plus successful install/typing/Git-safety/artifact/cleanup steps.
- Local browser preflight initially encountered a cold Chromium context-creation timeout and a transient unavailable database response. Artifacts retained. Adjusted only the overall cold-browser setup budget, kept the application's 8-second timeout and all readiness assertions, verified PostgreSQL and reran all 12 foundation cases successfully without retries. No future requirement failures were suppressed.
- [MCP re-review](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/1#pullrequestreview-6006336494), ID `6006336494`, at head `4fb1fd3`: actual service/migration/regression/workflow/Playwright/scope patches inspected; no unresolved critical/high finding identified in the requested change and delivered-foundation scope. COMMENT only, not independent approval.
- Original currency thread `PRRT_kwDOV2tDPs66YZEJ` was replied to with fix/test evidence and resolved through MCP. PR was marked ready through MCP after the first verified green GitHub run. State observed: OPEN, `draft=false`, `merged=false`.
- Whole-application gaps remain future work, not completed functionality. CI deliberately checks the delivered foundation; the full requirements suite retains its documented 14 failures and 45 blocked workflows until later modules exist. This is not production acceptance.
- This final documentation synchronization changes no executable behavior. Its push triggers a new current-head check; use the PR's latest **Foundation integrity** result and the subsequent MCP review comment for the final outcome. The ledger does not claim that an old-head success proves a new head passed.
- Before merge, an authorized independent reviewer must approve and GitHub's required checks/policies must be satisfied. The connected author account was not used to APPROVE, and no merge/protection change was performed. Adding a workflow does not configure required-check branch protection; administrators should verify **Foundation integrity** is enforced as intended.
