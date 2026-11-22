# ACME — AI/LLM integration reference (not applicable today)

**Purpose:** Prevent agents from assuming runtime AI functionality exists.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

No runtime LLM integration exists in this checkout. This explicit not-applicable document is retained so the requested handoff file set is complete; it does not invent providers, prompts, schemas or generation features. AI coding assistance used to build the repository is not an application service. Related: [CONTEXT.md](CONTEXT.md), [ORCHESTRATION.md](ORCHESTRATION.md), [BACKLOG.md](BACKLOG.md).

| Requested contract area | Actual implementation |
|---|---|
| Providers/factory/default/project override | None |
| LLM/API-key environment variables | None in config/config.ts or .env.example |
| Runtime prompts and JSON/Markdown schemas | None |
| Model method signatures/token limits | None |
| Async/thread wrappers or graph generation flags | None |
| Parse/post-process/document builder | None; no DOCX/PDF generation pipeline |
| AI fallback behavior | None |

Search scope: tracked API/web sources, manifests, controller registration, configuration, scripts and schema. There are no AI/transcription routes, embeddings/vector DB dependencies or AI state tables. Nodemailer, PostgreSQL and GitHub test CI are real integrations and must not be mislabeled AI orchestration.

If approved future scope introduces AI, first specify provider resolution, secret storage, input privacy, exact output schema/validation, async cancellation/timeouts, retry/fallback/idempotency, audit and tests. Obtain approval before sending salary or employee data to an external provider. Status of runtime AI product scope: deferred, not an existing backlog commitment.
