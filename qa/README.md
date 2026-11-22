# Browser acceptance tooling

Independent Playwright package,not an application build system. Install here with `npm ci --ignore-scripts`. Build frontend and backend using their own packages first. QA reads backend/.env only from Node launch commands; no server credentials enter the browser bundle. Commands: `npm run typecheck`,`npm run test:foundation`,`npm run test:login`. Install Chromium with `npx --no-install playwright install chromium`. Set PLAYWRIGHT_BROWSERS_PATH consistently when using a nondefault cache.

Only disposable synthetic databases may be used. Full future-requirement cases remain unmet/blocked; current executed verification is tracked in root GIT_CHANGELOG.md.

qa:report reproduces the original historical audit from retained initial/final evidence and writes only ignored qa-artifacts/historical-report files. It does not overwrite current canonical documentation or claim that historical missing features are current. Earlier evidence remains preserved in ignored acme-salary-app/qa-artifacts; copy evidence explicitly if reproducing that old audit.
