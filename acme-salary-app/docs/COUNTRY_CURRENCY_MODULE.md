# Country and currency administration (P4b)

Status: locally tested; PR #7 open; independent approval pending. 27 isolated PostgreSQL and 3 country/currency Chromium cases pass; existing unit/database/auth/team/reference/foundation regressions also pass. Approved client continuation on 22 November 2026 accepts the catalogue interpretation recorded below. Does not include FX administration (P4c), employee/salary/reporting screens, or deferred salary bands.

## Catalogue contract and provenance

FR-REF-01 is a read-only ISO 4217 catalogue pinned to SIX List One, publication 2026-09-17, retrieved 22 November 2026. `database/reference/iso4217.json` records source URL, raw XML SHA-256, 178 deduplicated codes/names/minor units. Migration 015 contains the corresponding facts. Numeric minor units exist for 165 entries; 13 N.A. entries remain visible but are unavailable for salary activation. No runtime network dependency or automatic catalogue refresh exists. Future updates require reviewed forward migrations and provenance updates, preserving historical/legacy currency rows.

HR may activate/deactivate supported currencies; ISO codes/minor units cannot be edited through HTTP. Existing rows are never overwritten by catalogue installation. A legacy configured precision mismatch cannot be activated silently. Precision correction requires an explicit reviewed migration, and the database rejects it whenever the currency is referenced by a country, salary/request, FX revision or report snapshot. Runtime has SELECT only on the catalogue. Currency code shape does not assert a separate ISO country-code catalogue.

Official source: https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml

## API

All paths use `/api/v1`, current hashed cookie sessions and no-store responses. All writes require exact Origin and bound CSRF; actors are taken only from the session. Catalogue reads allow HR or a member with `read`. Other endpoints are HR-only. Anonymous reads return 401; unauthorized authenticated reads/writes return 403. Strict DTOs reject unknown fields and invalid code/value shapes (400). Duplicates, stale versions, inactive defaults and protected configuration conflicts return 409.

| Method/path | Input | Response |
|---|---|---|
| GET /currency-catalogue | none | `{items}` with code, currency_name, minor_units/null, published_on, source, is_active, version, supported and configured_minor_units/null |
| GET /currencies | none | `{items}` configured code/minor_units/is_active/version, including legacy rows |
| PATCH /currencies/:code | `{isActive,expectedVersion}` | configured currency row; version 0 means first activation only |
| GET /countries?offset=0 | offset integer 0..100000 | `{items,total}`, 20 ordered country_name/code, includes inactive |
| POST /countries | `{countryCode,countryName,defaultCurrency,decimalPlaces,roundingMode,regulatoryNotes,retentionNotes}` | created country row/version 1 |
| PATCH /countries/:code | same policy fields without countryCode, plus `{isActive,expectedVersion}` | updated row; code immutable |

Country codes are exactly two uppercase letters; currency codes are three. Names trim to 1..200 characters. Country precision 0..4 and rounding HALF_UP/FLOOR/CEIL remain independent country policy settings, not forced to equal ISO minor units. Notes trim to at most 4000 characters each. Note updates merge the `notes` key and retain existing JSON metadata; no legal minimum-retention rule is invented. Active holds remain separately enforced. Country results expose regulatory_notes/retention_notes, not arbitrary metadata fields.

## Integrity, history and concurrency

Migrations 015/016 add currency_catalogue and currency version, immutable country/currency codes, soft deactivation/no-delete/no-truncate, auto versions, transactional before/after audits and active-reference checks. Country config writes use current HR identity and local reference actor. A country can be deactivated even when its currency is inactive, but activation/configuration of an active country requires an active default. Deactivating a currency is allowed with existing references; new records using it fail rather than rewriting history.

New assignments, requests, salary ledger entries, FX revisions and report snapshots share-lock relevant currency rows; assignments/request/ledger also share-lock/check the country. These locks conflict with concurrent deactivation/precision updates. Existing immutable history and stored policy snapshots remain unchanged. Approval ledger insertion rechecks status, so a pending request cannot bypass later deactivation. Country policy edits advance version, making older proposals stale under existing approval checks. Rejection does not insert a salary row and remains possible.

The database is a trusted server boundary: raw runtime credentials are not user accounts. Audit actor context is set by authenticated transactions; migration/admin operations require separate operator control. Existing data is never reset by migrations or test runners.

## UI and verification

Reader catalogue search shows ISO minor units, active state and unavailable entries. HR sees confirmed currency status actions and country list/create/edit/deactivate/reactivate forms, policy summaries, descriptive-notes warning, stale-conflict recovery, loading/empty/error/success, pagination and responsive tables. Codes disable during editing. No form can change currency precision.

`npm run test:country-currency` creates/drops only a unique synthetic database. `npm run test:login` runs auth/team, organization reference and country/currency groups sequentially in separate disposable databases; artifacts are retained separately. CI includes country/currency DB tests and all browser groups. Actual execution and intermediate failures are recorded in QA_EXECUTION_REPORT.md and TEST_CASES.md after running, not inferred from implementation.

Browser harness update: existing QA_RUN selects distinct web/API ports: login 4427/4428, references 4527/4528, country-currency 4627/4628; sequential capture SMTP remains 4325. The runner logs only group/stage/process status diagnostics. GitHub run 45006454596 failed during third-group startup before country cases executed; exact cause unproven. Port isolation and final-head CI are being retested without retries or relaxed assertions.
