import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const file = process.env.QA_ASSERT_REPORT;
if (file) {
  mkdirSync(path.dirname(file), { recursive: true });
  let index = 0;
  for (const method of ['equal', 'deepEqual', 'ok', 'notEqual', 'rejects']) {
    const original = assert[method];
    assert[method] = function (...args) {
      const stack = new Error().stack || '';
      const location =
        stack
          .split('\n')
          .filter((line) => line.includes('/scripts/test-') || line.includes('\\scripts\\test-'))
          .at(-1)
          ?.trim() || 'unknown';
      let scenario = location;
      const source = location.match(/(file:\/\/.+):(\d+):(\d+)/);
      if (source) {
        try {
          scenario =
            readFileSync(fileURLToPath(source[1]), 'utf8')
              .split('\n')
              [Number(source[2]) - 1].trim() +
            ' — ' +
            location;
        } catch {
          /* Source location remains available. */
        }
      }
      const describe = (value) =>
        typeof value === 'function' || value instanceof RegExp
          ? String(value).slice(0, 500)
          : JSON.stringify(value)?.slice(0, 500);
      const record = (status, error) =>
        appendFileSync(
          file,
          JSON.stringify({
            id: `${path.basename(process.argv[1])}-${++index}`,
            module: path.basename(process.argv[1]),
            scenario,
            assertion: method,
            status,
            expected:
              method === 'ok'
                ? 'Truthy'
                : method === 'rejects'
                  ? `Rejects as specified: ${describe(args[1])}`
                  : describe(args[1]),
            actual:
              status === 'PASS'
                ? method === 'rejects'
                  ? 'Rejected with expected predicate/regex'
                  : describe(args[0])
                : error?.message,
            // Include source location without recording arbitrary assertion operands or secrets.
            issue: status === 'FAIL' ? String(error?.code || 'ASSERTION_FAILED') : null,
          }) + '\n',
        );
      try {
        const result = original.apply(assert, args);
        if (result && typeof result.then === 'function')
          return result.then(
            (value) => {
              record('PASS');
              return value;
            },
            (error) => {
              record('FAIL', error);
              throw error;
            },
          );
        record('PASS');
        return result;
      } catch (error) {
        record('FAIL', error);
        throw error;
      }
    };
  }
}
