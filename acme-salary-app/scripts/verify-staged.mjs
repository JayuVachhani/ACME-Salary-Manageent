import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import path from 'node:path';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
  windowsHide: true,
}).trim();
const git = (args) =>
  execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
const files = git(['ls-files', '--cached', '-z']).split('\0').filter(Boolean);
const secrets = [];
const envFile = path.join(root, 'acme-salary-app/.env');
if (existsSync(envFile)) {
  const env = parseEnv(readFileSync(envFile, 'utf8'));
  for (const name of ['DATABASE_URL', 'MIGRATION_DATABASE_URL', 'OTP_HMAC_SECRET', 'SMTP_PASSWORD'])
    if (env[name]) secrets.push(env[name]);
}
const credentialFile = path.join(root, 'acme-salary-app/.local/database.json');
if (existsSync(credentialFile))
  secrets.push(...Object.values(JSON.parse(readFileSync(credentialFile, 'utf8'))));
const forbidden =
  /(^|\/)(node_modules|\.local|qa-artifacts|dist|coverage|test-results|playwright-report)\/|(^|\/)\.env(?:\..+)?$|\.(pem|key|p12|pfx)$/i;
const token =
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16})\b/;
const problems = [];
for (const file of files) {
  if (forbidden.test(file) && file !== '.env.example' && !file.endsWith('/.env.example'))
    problems.push(`${file}: prohibited runtime/credential path`);
  const content = git(['show', `:${file}`]);
  if (content.includes('\0') || Buffer.byteLength(content) > 2 * 1024 * 1024)
    problems.push(`${file}: unexpected binary or oversized file`);
  if (
    token.test(content) ||
    secrets.some(
      (secret) => typeof secret === 'string' && secret.length >= 16 && content.includes(secret),
    )
  ) {
    problems.push(`${file}: possible credential detected (value withheld)`);
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `PASS: ${files.length} indexed files checked; no prohibited paths, known local credentials or high-confidence token patterns found. This is not a guarantee against every secret type.`,
  );
