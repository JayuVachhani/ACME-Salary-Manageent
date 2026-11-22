# ACME React frontend

Self-contained React19/TypeScript6/Vite8 package. Install and run commands here; backend packages are not imported or needed to build it.

- `npm ci --ignore-scripts`
- Copy .env.example to .env.local if a development proxy override is needed.
- `npm run dev`: http://localhost:5173
- `npm run build`: static output in dist/
- `npm run preview`: local built-site preview at http://localhost:4173 (backend APP_ORIGIN must match this origin).
- `npm run quality:check`: frontend-only format,lint,types,units,build and architecture.

Vite proxies relative /api,/healthz,/readyz to API_PROXY_TARGET (default http://127.0.0.1:3001). This setting is read by the Vite server and never contains secrets. Browser-exposed variables must use VITE_ and must be public. Independent strict app/node TypeScript projects and React-specific ESLint rules are local to this folder. Source architecture stays app/features/shared with Redux Toolkit/RTK Query.

Independent package lint/types/units/build and related architecture checks passed after commit/push authorization; final publication gates are tracked in GIT_CHANGELOG.md.

ESLint uses native ESM .mjs config to avoid a TypeScript config-loader dependency; Vite/Vitest use their natively supported TypeScript configs.
