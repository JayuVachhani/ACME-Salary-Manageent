# Team invitations and permissions

Implements FR-AUTH-07/08/10/11/14/15/18/19, approved OD-03/04/05 and transactional user audit requirements FR-AUD-01/02. HR Managers may invite other managers or members, assign any of the six approved permissions, modify names/roles/permissions, renew pending invitations and soft-remove access. Business modules still enforce `read` in addition to their specific privileges; this screen does not silently add permissions. HR status implies all privileges.

## Contracts

- `GET /api/v1/team?offset=0`: current active HR session only. Returns 20 live/invited members per page and a total; system and removed identities are excluded. Responses are no-store.
- `POST /api/v1/team`: `{email,fullName,isHrManager,permissions}`. Case-insensitive duplicate live email returns 409. Saves an INVITED account with a seven-day expiry and sends a real SMTP invitation after commit. Response includes the saved account and `delivery: sent|failed`; failed delivery is audited and visibly recoverable by Reinvite. No automatic OTP is emailed; the invitee requests it through login.
- `PATCH /api/v1/team/:id`: `{fullName,isHrManager,permissions,expectedVersion}`. Rejects stale versions (409), non-HR access (403), and own role/permission changes (403). Emails and employee links cannot be changed through this API.
- `POST /api/v1/team/:id/reinvite`: `{expectedVersion}`. Only pending INVITED identities can be renewed. Extends the seven-day expiry, invalidates open OTPs, increments the version, and retries invitation delivery. Active/removed/stale accounts return 409.
- `DELETE /api/v1/team/:id`: `{expectedVersion}`. Soft-removes the account and revokes all sessions/open OTPs atomically. Permanent deletion is prohibited. Rejoining uses a new invitation and fresh ID. Historical employee/salary records and original user attribution are preserved. This is access offboarding, not employee removal or a retention-hold override.
- All mutations require an exact configured Origin and session-bound header CSRF token. All DTOs reject unknown fields, invalid privileges and duplicate privileges. The actor comes only from the session, never request data.

## Integrity and concurrency

The shared session guard holds the current identity lock through the entire business transaction; authorization is not a separate check followed by an unguarded mutation. A transaction advisory lock serializes team decisions. Monotonic `team_version` rejects stale forms, including invitation acceptance races. Database triggers enforce system-identity protection, no permanent deletion, own-permission restrictions for the trusted team actor context, and last-active-manager continuity. Concurrent manager removals and direct SQL demotions cannot leave zero active managers. Self-removal is subject to the same remaining-active-manager requirement; own permission changes remain forbidden.

Forward migrations 011/012 preserve earlier checksums. Team writes automatically append immutable actor-attributed before/after user snapshots in the same transaction. Audit failure rolls back the entire team write and version. OTP acceptance separately audits the INVITED-to-ACTIVE transition. Session and report authorization invalidation uses the existing triggers. Audit snapshots contain user metadata, not OTPs, session secrets or SMTP credentials.

The UI provides native modal confirmation with concrete account/access details, pagination, visible delivery/error states and disabled own-permission controls. It only renders for a current HR identity; backend checks remain authoritative if permissions change while a page is open.

## Verification and boundaries

`npm run test:team`: isolated PostgreSQL service/trigger tests, including permission refresh, duplicate/stale input, reinvitation, parallel manager removals, direct SQL continuity, fresh rejoin IDs and injected audit failure. `npm run test:login`: real Chromium + SMTP tests under `e2e-auth`, now including independent HR/member browser contexts, confirmed invitations, permission changes, offboarding, CSRF, pagination, mobile overflow, axe checks and SMTP-failure visibility. No external email or real employee data is used. CI executes both.

User-to-employee linkage remains part of employee integration; this module does not invent or expose a way to reassign employee identities. Audit browsing, employee/reference/compensation/reporting UI, full action-matrix acceptance and production qualification remain future increments. None of the current passes is full-system acceptance.
