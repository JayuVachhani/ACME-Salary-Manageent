import { createHash } from 'node:crypto';

/** Preserve old Windows checksums without modifying SQL or rewriting migration history. */
export function migrationChecksum(sql) {
  return createHash('sha256').update(sql).digest('hex');
}

export function matchesMigrationChecksum(sql, recordedChecksum) {
  if (migrationChecksum(sql) === recordedChecksum) return true;
  // Only CRLF/LF conversion is compatible. Bare CR and every SQL/content change still fail.
  const lf = sql.replaceAll('\r\n', '\n');
  if (lf.includes('\r')) return false;
  return [lf, lf.replaceAll('\n', '\r\n')].some(
    (value) => migrationChecksum(value) === recordedChecksum,
  );
}
