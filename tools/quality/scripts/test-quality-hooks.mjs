import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  symlinkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import husky from 'husky';

const app = fileURLToPath(new URL('..', import.meta.url));
const repo = path.resolve(app, '../..');
const parent = path.join(app, '.local', 'quality-hook-tests');
mkdirSync(parent, { recursive: true });
const fixture = mkdtempSync(path.join(parent, 'run-'));
assert.equal(path.dirname(fixture), parent);
const originalCwd = process.cwd();
const env = {
  ...process.env,
  PATH: [
    path.dirname(process.execPath),
    path.join(app, 'node_modules', '.bin'),
    process.env.PATH,
  ].join(path.delimiter),
};
for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR']) delete env[key];
const git = (...args) =>
  spawnSync('git', args, { cwd: fixture, env, encoding: 'utf8', windowsHide: true });
const runGit = (...args) => {
  const result = git(...args);
  assert.equal(result.status, 0, result.stderr);
  return result;
};
const write = (name, text) => {
  const target = path.join(fixture, name);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
};
try {
  runGit('init', '--quiet');
  runGit('config', 'user.name', 'Synthetic Hook Test');
  runGit('config', 'user.email', 'hook@acme.test');
  for (const name of ['.lintstagedrc.json'])
    cpSync(path.join(repo, name), path.join(fixture, name));
  for (const name of ['pre-commit', 'pre-push'])
    write(`.husky/${name}`, readFileSync(path.join(repo, '.husky', name)));
  write(
    'tools/quality/package.json',
    JSON.stringify({
      private: true,
      scripts: {
        'quality:staged': JSON.parse(readFileSync(path.join(app, 'package.json'))).scripts[
          'quality:staged'
        ],
      },
    }),
  );
  for (const name of ['scripts/verify-staged.mjs', '.prettierrc.json', '.prettierignore'])
    write(`tools/quality/${name}`, readFileSync(path.join(app, name)));
  process.chdir(fixture);
  assert.equal(husky(), '', 'Fixture hooks must install');
  process.chdir(originalCwd);
  for (const name of ['.prettierrc.json', '.prettierignore', 'eslint.config.mjs'])
    write(`frontend/${name}`, readFileSync(path.join(repo, 'frontend', name)));
  // Reuse installed tools through a fixture-local junction; application sources remain isolated.
  symlinkSync(
    path.join(repo, 'frontend/node_modules'),
    path.join(fixture, 'frontend/node_modules'),
    'junction',
  );
  symlinkSync(
    path.join(app, 'node_modules'),
    path.join(fixture, 'tools/quality/node_modules'),
    'junction',
  );
  const source = 'frontend/src/fixture.ts';
  write(source, 'export const value=1');
  runGit('add', source);
  const badFormat = git('commit', '-m', 'test: reject formatting');
  assert.notEqual(badFormat.status, 0);
  assert.match(badFormat.stdout + badFormat.stderr, /Code style issues|prettier.*check/is);
  console.log('PASS hook rejects unformatted staged source');
  write(source, 'export const value: any = 1;\n');
  runGit('add', source);
  const badLint = git('commit', '-m', 'test: reject lint');
  assert.notEqual(badLint.status, 0);
  assert.match(badLint.stdout + badLint.stderr, /no-explicit-any/);
  console.log('PASS hook rejects staged lint violation');
  write(source, 'export const value = 1;\n');
  runGit('add', source);
  write('backend/.env', 'SYNTHETIC=placeholder\n');
  runGit('add', '-f', 'backend/.env');
  const unsafe = git('commit', '-m', 'test: reject runtime file');
  assert.notEqual(unsafe.status, 0);
  assert.match(unsafe.stdout + unsafe.stderr, /prohibited|runtime|FAIL/i);
  console.log('PASS hook rejects prohibited staged runtime file');
  runGit('rm', '--cached', 'backend/.env');
  const good = git('commit', '-m', 'test: accept valid staged source');
  assert.equal(good.status, 0, good.stdout + good.stderr);
  assert.equal(runGit('rev-list', '--count', 'HEAD').stdout.trim(), '1');
  console.log('PASS hook accepts valid staged source; only disposable fixture committed');
} finally {
  process.chdir(originalCwd);
  assert.equal(path.dirname(fixture), parent);
  rmSync(fixture, { recursive: true, force: true });
}
