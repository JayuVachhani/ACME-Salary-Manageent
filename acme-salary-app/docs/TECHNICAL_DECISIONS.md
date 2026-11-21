# Technical decision index

Authoritative decisions are recorded in [DECISIONS.md](DECISIONS.md), including ADR-002 (21 November 2026).

## Implementation choices

- Keep PostgreSQL-specific integrity in forward-only, checksummed SQL migrations. Prisma schema is introspected from the migrated database and Prisma Client provides typed access. Never run `prisma db push` against application data: it cannot preserve all triggers, checks and derived objects.
- Pin stable Prisma 7.10.1; npm's current Prisma CLI `latest` resolves to an 8.x release candidate. Use the matched stable client/adapter/CLI instead of adopting a release candidate without need.
- Override Prisma config's transitive Effect dependency to 3.22.1 for [GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw). Final dependency audit is clean and Prisma generation passes with the override. Remove the override only after upstream adopts a patched version and compatibility checks pass.
- Prisma's PostgreSQL adapter uses runtime-only credentials; migrations use owner credentials. Query/parameter logging is disabled.
- Approval request and decision records are immutable. Authoritative salary rows exist only after approval for backdated changes. Deferred database constraint prevents an approved decision from committing without its salary row.
- Salary insertion automatically appends history/audit and advances employee version in the same transaction. Business dates come from the application's UTC clock, including a controllable test clock.
- Calculated amounts use decimal.js at 60 significant digits. Reject entered salary precision beyond country rules; keep conversion legs unrounded until final calculation/display rounding. FX provenance includes immutable rate IDs and inverse flags.
- Snapshot reads lock/re-read current user state, verify compensation/export permissions and ownership, and check stored authorization version, invalidation and expiry within the caller's transaction. These guards are internal until authenticated endpoints are delivered.
- Retention hold/release records are immutable and HR-attributed; database triggers serialize holds against employee removal and audit hold events.

## Remaining implementation work

Session guards and APIs/UI are not delivered yet. The internal approval service receives its actor from the future trusted session boundary, not a client-supplied body field. Retry/idempotency, lease integration, complete input DTOs, reference administration and approval UI/E2E belong to later vertical slices. Do not advertise the approval module as complete based on backend/database tests alone.
