# FX rate administration (P4c)

Implements FR-REF-02/05, historical lookup FR-ANA-04/05 and approved ADR-002. Status: implemented;23 FX PostgreSQL and3 FX Chromium cases passed locally. PR checks/independent review remain required. FX data is HR-maintained only, not an external provider or per-salary override. Employee/salary/report user workflows and production qualification remain incomplete; bands deferred.

## HTTP contracts

All endpoints are under `/api/v1/fx-rates`, return no-store and revalidate the current hashed session in the same transaction. HR has implicit rights; a non-HR account needs `read` for list/lookup, and cannot write regardless of ordinary employee write/edit rights. POST also requires exact configured Origin and session-bound CSRF. Actors never come from request bodies.

| Method | Input | Response |
|---|---|---|
| GET / | Strict optional base/quote/asOf, offset0..100000 | `{items,total}`; page20 ordered effective_date descending, base/quote, revision descending, ID; all immutable revisions retained |
| POST / | Strict `{base,quote,effectiveDate,rate,source,reason,expectedRevision}` | 201 appended row; expectedRevision0 for first quote, otherwise exact latest revision for pair/date |
| GET /resolve | Strict `{base,quote,asOf}` | `{base,quote,asOf,maxStalenessDays,rate,path}`; factor for one base unit, exact decimal string and full selected revision IDs/date/source/inverse flags |

Currency codes are three uppercase letters; date is a real YYYY-MM-DD (year0001 onward). Pair currencies differ for writes. Rate is a plain positive decimal string: at most10 integer and8 fractional digits, no exponent/sign/leading zero anomalies; bounds0.00000001..9999999999.99999999. Excess precision is rejected, never silently rounded into NUMERIC(18,8). Source/reason trim and require1..500/1..2000 characters. Same-currency lookup requires a configured currency and returns factor1/empty path. Unknown DTO fields, actor spoof, malformed dates/rates return400; anonymous read401; permission/Origin/CSRF403; stale/inactive references409; missing/stale/unknown-currency lookup422.

## Persistence, history and audit

Existing fx_rate_revisions remains authoritative and immutable; no edit/delete endpoint. POST share-locks both active currencies in stable code order, takes the existing pair/date advisory lock, compares expectedRevision, then appends current+1. The SQL trigger independently checks sequence/HR identity; existing active-reference guards recheck currency status. Competing independent HR submissions have exactly one winner. Failures roll back rate and audit together; no SMTP or other external side effect.

Forward migration018 changes audit_fx_revision for NEW audit events only: payload `{before,after}` includes the previous same-pair/date revision or null and the complete new row. Existing rate/audit rows remain unchanged. Audit actor/source/reason/date/revision/recorded timestamp are preserved. Correcting a quote changes future recalculation with that as-of date, but existing salary/report snapshots retain their recorded revision provenance; no snapshot/ledger rewrite is performed here.

History filters use effective_date<=asOf; resolution chooses latest eligible date and same-date revision. The existing resolver prefers direct, then inverse, then two-leg USD; every leg must satisfy FX_MAX_STALENESS_DAYS (default7), now wired through the public controller. Numeric operations use existing 60-significant-digit Decimal helpers without intermediate monetary rounding. This unit-factor preview is not a payroll calculation or report generator. Future-effective stored rows are not used before their date. Deactivated currencies cannot receive NEW quotes but their historical rows remain readable/resolvable; no rate is silently replaced with today's quote.

## UI and tests

Readers see historical filters/pagination and explicit as-of lookup with leg provenance. HR additionally selects active currencies/date, loads current revision, enters rate/source/reason and confirms the full direction/value/date/revision summary. Cancellation saves nothing. Preparing a correction loads the latest revision while retaining prior history. A409 requires refreshing/loading current revision and deliberate resubmission; there is no silent merge or automatic write retry. Loading/empty/error/success, lookup failures and responsive tables are implemented.

`npm run test:fx` uses a unique synthetic PostgreSQL database and verifies permissions, exact boundaries, independent-HR revision races, deactivation waits, audit rollback, before/after and direct/inverse/USD/stale/future selection. `npm run test:login` adds an FX Chromium group with separate synthetic database and web/API4727/4728 (SMTP4325 sequential). Diagnostics under qa-artifacts/fx remain ignored. CI includes both. Only actually executed results are recorded in QA_EXECUTION_REPORT.md/TEST_CASES.md; scoped passes do not establish full-system or production acceptance.
