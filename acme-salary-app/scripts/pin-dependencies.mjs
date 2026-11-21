import { readFileSync, writeFileSync } from 'node:fs';
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
for (const file of ['package.json', 'apps/api/package.json', 'apps/web/package.json']) {
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  for (const group of ['dependencies', 'devDependencies']) {
    for (const name of Object.keys(manifest[group] || {})) {
      const entry = lock.packages[`node_modules/${name}`];
      if (!entry?.version) throw new Error(`Missing installed version for ${name}`);
      manifest[group][name] = entry.version;
    }
  }
  writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
}
