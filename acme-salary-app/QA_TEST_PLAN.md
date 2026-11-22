# ACME QA test plan

Date: 21 November 2026. Scope: current local implementation, not a hypothetical completed release.

## Basis and inventory

Reviewed BRD, FRD and SDD including approved addenda, ADR-002, implementation/progress/traceability documents and existing config, policy, money, PostgreSQL, approval, Prisma and health tests. Approved decisions override superseded original text: OTP 15 minutes; separate salary visibility/export; independent HR approval for backdated changes; pending/rejected requests excluded from pay; historical FX; retention holds; permission-revalidated snapshots.

Current code inventory: one React foundation screen, skip link, service status and three informational panels. No login, inputs, business buttons, menus, confirmations or domain screens. NestJS exposes health endpoints only. Database services exist for approval and snapshot access, but no authenticated API links them to the browser. The executable browser audit will confirm this inventory instead of treating it as sufficient evidence.

## Execution strategy

1. Install pinned Playwright, Chromium and axe tooling within the project. Dedicated loopback QA ports prevent reuse of another development instance.
2. Run the real web app and API under Playwright webServer lifecycle. Exercise desktop/tablet/mobile layouts, keyboard navigation, status/loading/failure handling, console/network errors, accessible landmarks and automated WCAG scans.
3. Probe all requested workflow entry points and API routes. Missing entry capabilities fail explicit requirement tests. Downstream cases are recorded BLOCKED, not passed or silently skipped. Do not invent controls, fake login or test-only feature implementations to make results green.
4. Rerun existing unit and real PostgreSQL tests. Distinguish database/service evidence from browser E2E, especially pending/rejected salary selection and approval using separate synthetic actors.
5. Add regressions for discovered defects, fix bounded implementation issues, and preserve initial/final Chromium results, traces and screenshots. Run failed tests again after fixes.
6. Generate per-case expected/actual/status/issue tables and report overall readiness without hiding known requirement failures.

## Safety and evidence

Only synthetic data. Browser probes do not send employee mutations; public route probes use synthetic email or invalid synthetic IDs. Existing PostgreSQL suites either roll back fixtures or use a uniquely named disposable database. Do not truncate or reset the application database. Separate QA requester/approver actors are created only by the isolated approval suite; authenticated browser accounts cannot be created until bootstrap/auth exists.

Evidence: Playwright JSON/HTML, screenshots, traces, inventory and console/network attachments under `qa-artifacts/<run>/`; all commands and dispositions appear in QA_EXECUTION_REPORT.md. Browser status fault injection is explicitly labeled and does not prove live SMTP/database failures are handled.

## Coverage matrix / exit criteria

Authentication/OTP/session; invites/permission matrix; employee validation/search/removal; salary exactness/history; two-user locks; independent approvals; historical transfers; country precision/FX; report preview/CSV/snapshots; HR-only audit; responsive/accessibility/error states; real-database integrity; 10k seed/performance.

Release acceptance requires all critical workflows actually run, passing browser/API/database permission tests, no open critical/high defects, full synthetic seed and required performance/security checks. Missing modules prevent release acceptance even if the foundation regression suite passes. Automated axe checks are a subset of accessibility validation, not a WCAG conformance certification.
## Login increment verification

Run `npm run test:login` for isolated PostgreSQL + actual Chromium + loopback SMTP delivery. Cover real code receipt, sign-in, session cookie attributes, page reload, origin/DTO rejection, unknown-account responses, resend invalidation, attempt limits, logout/CSRF, SMTP failure and spoofed-forwarded-header throttling. Run `test:authentication` for concurrency, expiry, bootstrap and all email/IP thresholds, and retain the existing foundation suite. Use synthetic addresses only. Earlier full-application failures remain historical evidence until those workflows are executed again.
