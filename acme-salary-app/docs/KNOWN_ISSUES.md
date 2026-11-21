# Known issues and remaining scope

Actual Chromium QA (21 November 2026): required login/OTP and business module entry tests fail; protected API probes return 404. Final 12 pass / 14 fail; 45 dependent E2E scenarios blocked. See `../BUG_REPORT.md` for severity, reproduction and verified fix dispositions. Three frontend defects/hardening findings were fixed and rerun successfully. Existing backend/database passes do not mean the application is usable end to end.

- The application is not ready for operational salary use. Authentication, sessions, invites, domain APIs/UI and real SMTP delivery are pending.
- Approval backend and database are implemented and tested; there is no public approval endpoint or usable approval screen yet. All actor identifiers must come from authenticated session guards when APIs are added.
- No 10k seed, complete currency catalogue, salary-band maintenance, report generation/export, dashboard, full concurrency load, browser/E2E or security scans yet.
- Schema readiness intentionally returns 503 until the entire application schema/readiness contract is finalized. Liveness alone does not establish operational readiness.
- No country-specific minimum retention durations or legal compliance policy has been supplied. Explicit holds are enforced; this does not claim jurisdiction-specific legal compliance.
- Original SOW delivery estimate predates the newly approved backdated approval feature. Revised effort remains to be measured; no production date is promised.
- PostgreSQL binaries are pinned as Windows development tooling. Portable application deployment is separate. Local `.env` and `.local` must remain private; Windows filesystem ACLs govern local credential confidentiality.
- Prisma introspection warns about unsupported check/expression-index representation. SQL migrations retain these protections; do not replace them with schema push.
- Department/designation administrative edit behavior, overlapping salary band policy, complete analytics catalogue and measured performance profile remain to be finalized before their modules.
