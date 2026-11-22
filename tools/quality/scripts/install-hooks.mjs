import { fileURLToPath } from 'node:url';

// CI installs with --ignore-scripts; production installs do not need development hooks.
if (process.env.CI || process.env.NODE_ENV === 'production' || process.env.HUSKY === '0') {
  process.exit(0);
}
const { default: husky } = await import('husky');
// package.json is in a subdirectory; Husky must run at the Git worktree root.
process.chdir(fileURLToPath(new URL('../../..', import.meta.url)));
const message = husky();
if (message) throw new Error(`Husky installation failed: ${message}`);
