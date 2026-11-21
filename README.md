# ACME Salary Management

Approved requirements and an in-progress React/NestJS/PostgreSQL application. This is **not a completed or production-ready salary system**. Latest actual Chromium audit: 12 passed, 14 failed; 45 dependent business scenarios blocked by missing authentication/domain APIs and screens. See the detailed [QA report](acme-salary-app/QA_EXECUTION_REPORT.md).

- [Development plan](DEVELOPMENT_PLAN.md)
- [Application setup and verification](acme-salary-app/README.md)
- [Approved decisions](acme-salary-app/docs/DECISIONS.md)
- [Requirement traceability](acme-salary-app/docs/REQUIREMENT_TRACEABILITY.md)
- [Bugs and unfinished functionality](acme-salary-app/BUG_REPORT.md)

All development and tests use synthetic employees only. Runtime `.env`, credentials, local database files, browser binaries and QA traces remain local and ignored. `.env.example` is a non-secret configuration template.

## Git workflow

Only `JayuVachhani/ACME-Salary-Manageent` is authorized for this project. Branch from current `origin/main` using `feature/`, `bugfix/`, or `chore/`; push verified logical commits to that branch and open a PR targeting `main`. Do not push directly to protected branches, merge without required review, force-push, delete branches, or overwrite others' work. The client authorized one empty initial `main` commit solely to bootstrap the previously empty remote.

The first application import is explicitly a pre-Git baseline, not fabricated feature-by-feature historical commits. Subsequent features, bug fixes and test improvements are committed separately. The initial PR remains draft because known incomplete business workflows prevent release acceptance.
