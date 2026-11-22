/** Only stable SQLSTATE is safe to log; never connection strings, query text or parameters. */
export function sqlState(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && /^[A-Z0-9]{5}$/.test(error.code)) return error.code;
  return undefined;
}
export function logDatabaseFailure(event: 'database_background_error' | 'database_rollback_failed', error: unknown): void {
  process.stderr.write(JSON.stringify({ event, code: sqlState(error) }) + '\n');
}
