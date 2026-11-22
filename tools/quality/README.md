# Repository Git quality tooling

Optional orchestration only. It owns Husky,lint-staged and the indexed credential/path scanner,not framework configurations or builds. Install with npm ci --ignore-scripts,then npm run hooks:install. Frontend/backend format/lint configs and dependencies stay in their own directories. Both application packages and qa must be installed for the complete pre-push gate. Package-local commands remain independently runnable.

Pre-commit runs package-native non-writing staged checks and indexed safety. Pre-push delegates to frontend/backend quality:check,QA typing and indexed safety. New application ownership is recorded in root README.md. Package quality and hook integration checks passed; final publication is tracked in GIT_CHANGELOG.md.

Root .lintstagedrc.json only routes staged paths to package-local executables/configs; it defines no framework/compiler rules. Root .editorconfig is editor-wide whitespace guidance.
