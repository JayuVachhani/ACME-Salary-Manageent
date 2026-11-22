# ACME — roles, permissions and route authorization

**Purpose:** Map real security checks without inventing framework guards.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 0e0fb86 (merged PR #7), plus the P4c FX increment on feature/fx-rate-administration.

## Executive summary

There are two human role classes (active HR Manager and granular-permission member), an INVITED eligibility state, a DELETED access state and a non-login system identity. No platform admin/project-scoped/viewer role enum exists. read alone cannot view salary values or export. Internal policy helpers are not proof of protected business endpoints. See [CONTEXT.md §8](CONTEXT.md#8-api-route-map) for route-ID paths and [WORKFLOW_RULES.md](WORKFLOW_RULES.md) for transitions.

## Role hierarchy and permission matrix

| Identity | read | write | edit | delete | salary:view | export | Team admin |
|---|---|---|---|---|---|---|---|
| ACTIVE HR Manager | implicit | implicit | implicit | implicit | implicit | implicit | yes, with self/system/continuity guards |
| ACTIVE member | assigned | assigned | assigned | assigned | assigned | assigned | no, even if all six are assigned |
| INVITED | no session until eligible OTP acceptance | no | no | no | no | no | no |
| DELETED | no | no | no | no | no | no | no |
| System identity | no login | no | no | no | no | no | no |
| Anonymous | no | no | no | no | no | no | no |

write means create, edit means modify, delete means soft-remove. Business writes/export additionally require read; permissions do not auto-imply it. canChangeSalary requires read+edit+salary:view and employeeId != target; canExportSalary requires read+salary:view+export. HR implicit rights do not bypass self salary/approval/permission rules. Verified employee linkage is still missing before public salary integration.

## Backend check map

| Function / dependency | Actual allowed scope |
|---|---|
| authController origin() | Exact APP_ORIGIN on auth POSTs; no blanket CORS enablement |
| AuthenticationService.authenticate / authenticateWithin | ACTIVE non-system user, valid hashed cookie session, nonrevoked/unexpired; optional bound CSRF comparison |
| TeamService.run | Same-transaction current HR; global team lock; bound CSRF for mutations; sets trusted DB actor locally |
| protect_team_identity | Current trusted HR context; no own role/permission changes, no system mutation/permanent delete, last active HR retained |
| OrganizationReferencesService.run | Same-transaction active HR session; bound CSRF for writes; sets local reference actor; allowlisted kind at SQL boundary |
| guard_organization_reference / validate_assignment_references | Immutable IDs, no delete/truncate, automatic versions; active reference rows shared-locked for new assignments |
| policy.can | ACTIVE non-system; HR implicit or specific assigned permission |
| policy.canManageUser | HR and different target ID; **internal helper not used by live TeamService**, which allows own name/conditional removal |
| SQL validate_salary_request/decision | Active non-system HR; requester/subject independence; relies on nullable employee mapping |
| readSalarySnapshot | Same-transaction fresh user, read+salary:view (+export), owner/version/unexpired/noninvalidated snapshot |

There is no Nest AuthGuard, Roles decorator, JWT bearer scope, row-level database role per employee, country scope or project scope. acme_app is a trusted server role, not an end-user login. Never pass a client actorId into an internal salary service.

## Route × dependency matrix

IDs resolve to the canonical [route map](CONTEXT.md#8-api-route-map); this avoids duplicating a third full route list.

| Route IDs | Anonymous / member / HR | Additional checks |
|---|---|---|
| H01,H02 | Public | Only liveness/readiness metadata; readiness deliberately closed |
| A01,A02 | Public request boundary | Origin, strict email, aggregate email/IP limits, eligibility enforced privately; generic 202 |
| A03 | Public verification boundary | Origin, strict UUID/six digits, three attempts, single use, expiry, current account/invite, IP throttle |
| A04 | Valid member or HR session | Fresh identity/status/rights; cookie is not a JWT |
| A05 | Valid member or HR session | Origin+CSRF, persistent revoke and cookie clearing; invalid request 403 |
| T01 | HR only | No system/deleted accounts; bounded offset and 20-row page; anonymous 401/member 403 |
| T02 | HR only | Origin+CSRF; strict role/permissions/name/email; duplicate live email 409; audited seven-day invitation |
| T03 | HR only | UUID+expectedVersion, own role/permission restriction, active-HR continuity and same-transaction audit |
| T04 | HR only | UUID+version; no system or permanent deletion; retain last HR, revoke sessions/OTPs and invalidate snapshots |
| T05 | HR only | Pending INVITED target/version; new expiry, invalidate codes, audit and SMTP notification |
| O01,O04 | HR only | Strict bounded offset, 20 rows/page; includes inactive; anonymous 401/member 403 |
| O02,O05 | HR only | Origin+bound CSRF, strict trimmed name; active/inactive uniqueness, audit atomicity |
| O03,O06 | HR only | Same + UUID, explicit isActive and expectedVersion; stale 409; rename/deactivate/reactivate with stable ID |
| C01 | HR or member with read | Current session; read-only pinned catalogue; N.A. entries listed |
| C02,C04 | HR only | Configured currencies/country policies; country list bounded 20/page |
| C03,C05,C06 | HR only | Exact Origin, bound CSRF, strict DTO, immutable codes, optimistic versions, transactional audit, active-default/precision protections |
| F01,F03 | HR or read member | Fresh session; list history and resolve as-of; no salary:view/export needed for reference rates |
| F02 | HR only | Exact Origin/bound CSRF, strict DTO, active currencies, expectedRevision/pair-date lock, atomic audit |

## Frontend path × guard

| Path/surface | Guard component | Who sees it / authority |
|---|---|---|
| / foundation and login form | main.tsx, Login local state | Public, no private employee data |
| / signed-in session controls | Login /me revalidation | Any valid account; CSRF cookie alone does not authenticate |
| / Team section (not a /team route) | identity.isHrManager conditional mounts Team | HR only; backend still checks each request |
| / Organization references section | Login identity.isHrManager mounts OrganizationReferences | HR only; current backend session checked on every call |
| Team own-edit controls | self comparison disables role/permission fields | Own name may change; server rechecks actual fields |
| / Countries and currencies | Login checks HR or read permission; CountryCurrency hides admin controls for member | Catalogue read-member/HR; country/currency configuration HR only; backend authoritative |
| / Exchange rates | Login HR/read mounts FxRates | Read members see history/lookup; HR authoring controls; server authorizes every call |
| Planned employee/report/salary screens | None implemented | No claimed permission enforcement at missing endpoints |

Use independent browser contexts for role testing. Current tests cover HR/member denial, crafted actor/privilege fields, stale versions, own permission changes, both CSRF failures, independent offboarding and last-manager protection. Full cross-module role/action matrix remains blocked by missing modules, not waived. No admin privilege should be inferred from hidden/visible UI controls.
