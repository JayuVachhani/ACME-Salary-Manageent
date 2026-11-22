import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root = fileURLToPath(new URL('../src', import.meta.url));
const files = readdirSync(root, { recursive: true })
  .map((name) => name.replaceAll('\\', '/'))
  .filter((name) => /\.tsx?$/.test(name) && !/\.test\.ts$|\.d\.ts$/.test(name));
const graph = new Map();
let assertions = 0;
const check = (value, message) => {
  assert.ok(value, message);
  assertions++;
};
for (const name of files) {
  const full = path.join(root, name),
    source = readFileSync(full, 'utf8');
  const ast = ts.createSourceFile(
    name,
    source,
    ts.ScriptTarget.Latest,
    true,
    name.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  check(!ast.parseDiagnostics.length, `${name}: source must parse`);
  const imports = ast.statements
    .filter((node) => ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
    .map((node) => node.moduleSpecifier)
    .filter((node) => node && ts.isStringLiteral(node))
    .map((node) => node.text);
  const edges = [];
  for (const specifier of imports) {
    check(
      !/@nestjs|@prisma|^pg$|apps\/api|api\/src/.test(specifier),
      `${name}: browser cannot import backend infrastructure`,
    );
    if (!specifier.startsWith('.')) continue;
    const candidate = path.resolve(path.dirname(full), specifier);
    const resolved = [
      candidate + '.ts',
      candidate + '.tsx',
      path.join(candidate, 'index.ts'),
      candidate,
    ].find(existsSync);
    check(Boolean(resolved), `${name}: unresolved import ${specifier}`);
    if (!resolved || resolved.endsWith('.css')) continue;
    const relative = path.relative(root, resolved).replaceAll('\\', '/');
    edges.push(relative);
    if (name.startsWith('shared/'))
      check(relative.startsWith('shared/'), `${name}: shared code cannot depend on app/features`);
    if (name.startsWith('features/')) {
      const own = name.split('/')[1];
      check(
        relative.startsWith(`features/${own}/`) || relative.startsWith('shared/'),
        `${name}: a feature cannot import another feature or app`,
      );
    }
    if (name.startsWith('app/') && relative.startsWith('features/'))
      check(
        /features\/[^/]+\/index\.ts$/.test(relative),
        `${name}: app must use public feature entry points`,
      );
  }
  graph.set(name, edges);
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      /^(?:fetch|window\.fetch|globalThis\.fetch)$/.test(node.expression.getText(ast))
    ) {
      check(name === 'shared/api/client.ts', `${name}: fetch belongs in the shared transport`);
    }
    if (ts.isPropertyAccessExpression(node) && node.getText(ast) === 'document.cookie') {
      check(name === 'shared/api/client.ts', `${name}: cookies belong in the transport boundary`);
    }
    if (ts.isPropertyAccessExpression(node) || ts.isIdentifier(node)) {
      check(
        !/^(?:localStorage|sessionStorage|window\.localStorage|window\.sessionStorage)$/.test(
          node.getText(ast),
        ),
        `${name}: session credentials must not be persisted in browser storage`,
      );
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      if (['input', 'select', 'textarea', 'button', 'form', 'table'].includes(tag)) {
        check(
          name.startsWith('shared/ui/'),
          `${name}: reusable controls/table primitives belong in shared UI`,
        );
      }
    }
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(ast) === 'dialog')
      check(
        name === 'shared/ui/confirmation-dialog.tsx',
        `${name}: native dialog lifecycle must be shared`,
      );
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (/features\/[^/]+\/api\.ts$/.test(name))
    check(
      !imports.some((value) => value === 'react' || /use-|\/ui\//.test(value)),
      `${name}: API modules cannot depend on React/workflow/UI`,
    );
  if (name.includes('/ui/') && name.startsWith('features/'))
    check(
      !/\buse(?:State|Effect|Ref)\b/.test(source),
      `${name}: UI state/effects belong in workflow hooks`,
    );
}
const active = new Set(),
  done = new Set();
function walk(name) {
  check(!active.has(name), `Dependency cycle involving ${name}`);
  if (done.has(name)) return;
  active.add(name);
  for (const edge of graph.get(name) ?? []) walk(edge);
  active.delete(name);
  done.add(name);
}
for (const name of files) walk(name);
for (const feature of [
  'auth',
  'team',
  'organization-references',
  'country-currency',
  'fx-rates',
  'employees',
]) {
  for (const entry of [
    'index.ts',
    'api.ts',
    'types.ts',
    `use-${feature === 'auth' ? 'login' : feature}.ts`,
  ])
    check(existsSync(path.join(root, 'features', feature, entry)), `${feature}: missing ${entry}`);
}
check(
  !readFileSync(path.join(root, 'features/auth/login.tsx'), 'utf8').includes('Workspace'),
  'Login must not compose business modules',
);
check(
  !/useState|useEffect|fetch\(/.test(readFileSync(path.join(root, 'main.tsx'), 'utf8')),
  'main.tsx must only bootstrap',
);
console.log(
  `React architecture PASS: ${files.length} source files, ${assertions} boundary/import/cycle checks; feature API/hook/UI separation, one transport/dialog, bootstrap-only entry`,
);
