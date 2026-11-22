import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrationChecksum, matchesMigrationChecksum } from './migration-checksum.mjs';
const sql = 'CREATE TABLE synthetic_fixture (id integer);\n-- synthetic history\n';
test('accepts exact unchanged bytes', () =>
  assert.equal(matchesMigrationChecksum(sql, migrationChecksum(sql)), true));
test('accepts legacy CRLF hash from current LF source', () =>
  assert.equal(
    matchesMigrationChecksum(sql, migrationChecksum(sql.replaceAll('\n', '\r\n'))),
    true,
  ));
test('accepts LF history from CRLF checkout', () =>
  assert.equal(
    matchesMigrationChecksum(sql.replaceAll('\n', '\r\n'), migrationChecksum(sql)),
    true,
  ));
test('rejects a changed SQL operation', () =>
  assert.equal(
    matchesMigrationChecksum(sql.replace('integer', 'text'), migrationChecksum(sql)),
    false,
  ));
test('rejects whitespace edits beyond line-ending conversion', () =>
  assert.equal(
    matchesMigrationChecksum(sql.replace('id integer', 'id  integer'), migrationChecksum(sql)),
    false,
  ));
test('rejects a bare CR rewrite', () =>
  assert.equal(
    matchesMigrationChecksum(sql.replaceAll('\n', '\r'), migrationChecksum(sql)),
    false,
  ));
test('rejects unknown history', () =>
  assert.equal(matchesMigrationChecksum(sql, 'not-a-checksum'), false));
