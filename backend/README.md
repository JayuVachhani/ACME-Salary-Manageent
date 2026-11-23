# ACME NestJS backend

Self-contained NestJS12 application. Install and run commands here; no parent workspace is required. See [manual setup](../README.md). Owns src/,database/,scripts/,Nest CLI,TypeScript,ESLint,Prettier,Vitest,Prisma and server-only .env.

- `npm ci --ignore-scripts`: install the backend lockfile.
- `npm run db:local:start`: Windows-only project-local PostgreSQL. Existing legacy cluster is preserved automatically; fresh clones use backend/.local.
- `npm run db:migrate`,then `npm run db:generate`.
- `npm run start:dev`: official Nest CLI watch mode.
- `npm run build`; `npm run start:prod`: production compile/start (requires production-safe environment).
- `npm run quality:check`: backend-only source checks,tests and native build.

`@nestjs/config` owns .env loading and existing Zod startup validation. Environment precedence: process variables,then .env.<NODE_ENV>.local,.env.<NODE_ENV>,.env.local,.env. Secrets never belong in frontend/. API is loopback3001 by default. Local/test Swagger: /api/docs; production omits docs.

No migration SQL or business rule is changed by the package separation. Independent package lint/types/units/build and related architecture checks passed after commit/push authorization; final publication gates are tracked in GIT_CHANGELOG.md. Existing /readyz intentionally remains503/schema_not_verified; /healthz is the liveness check.

ESLint uses native ESM .mjs config; Nest CLI and TypeScript use native JSON configs. Existing database .mjs operational scripts are Node ESM commands,not a custom framework build system.

Migration integrity preserves stored hashes while accepting LF/CRLF-only checkout conversion. SQL edits and other whitespace changes still fail. Run `node --test scripts/migration-checksum.test.mjs` for the focused regression cases; never rewrite applied migration history to repair a line-ending mismatch.

## Unit-test configuration

`npm test` supplies synthetic configuration through Vitest. Its database and SMTP endpoints use an unreachable local port, so unit imports do not require `.env` or contact developer services. Real PostgreSQL/HTTP scripts still require the explicitly configured isolated database environment; they do not use this unit configuration.

