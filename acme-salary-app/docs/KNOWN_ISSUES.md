# Known issues and remaining scope

Historical baseline Chromium QA (21 November 2026) recorded 12 passes / 14 failures and 45 blocked downstream scenarios. Login was subsequently delivered and tested; team implementation and its detailed retests are recorded in QA_EXECUTION_REPORT.md and BUG_REPORT.md. Existing backend/database passes do not mean all compensation workflows are usable end to end.

- The application is not ready for operational salary use. Login/session and captured SMTP flows are verified; team administration is in its final verification/review increment. Reference, employee, salary and reporting APIs/UI and production SMTP/TLS deployment remain pending.
- Approval backend and database are implemented and tested; there is no public approval endpoint or usable approval screen yet. All actor identifiers must come from authenticated session guards when APIs are added.
- No 10k seed, complete currency catalogue, salary-band maintenance, report generation/export, dashboard, full concurrency load or complete business/security acceptance yet. Delivered login/team browser tests and foundation accessibility checks are separate evidence.
- Schema readiness intentionally returns 503 until the entire application schema/readiness contract is finalized. Liveness alone does not establish operational readiness.
- No country-specific minimum retention durations or legal compliance policy has been supplied. Explicit holds are enforced; this does not claim jurisdiction-specific legal compliance.
- Original SOW delivery estimate predates the newly approved backdated approval feature. Revised effort remains to be measured; no production date is promised.
- PostgreSQL binaries are pinned as Windows development tooling. Portable application deployment is separate. Local `.env` and `.local` must remain private; Windows filesystem ACLs govern local credential confidentiality.
- Prisma introspection warns about unsupported check/expression-index representation. SQL migrations retain these protections; do not replace them with schema push.
- Department/designation administrative edit behavior, overlapping salary band policy, complete analytics catalogue and measured performance profile remain to be finalized before their modules.

P5a:directory/profile is read-only and excludes salary values. Salary-band filtering,CRUD,verified account linkage,leases and pending initial-salary approval are not yet integrated. ADR-005 is approved; existing backdated-only requests need forward migration before creation is exposed. No client data was seeded/reset; production qualification remains open.

ADR-005 bootstrap dependency: a fresh installation has no employee for the first HR account to link to,but unlinked accounts may not modify/approve salaries and initial salary must be created pending with employee. Define an audited provisioning/import bootstrap before the creation/linkage slice; do not silently add an unlinked-HR salary exception. This does not block read-only directory delivery.
