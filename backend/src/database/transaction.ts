import type { Pool, PoolClient } from 'pg';
import { logDatabaseFailure } from './database-errors.js';

/** Owns mechanics only. Callers retain their authorization, lock order and business error mapping. */
export async function withTransaction<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  let started = false;
  let destroy = false;
  try {
    await client.query('BEGIN');
    started = true;
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    if (started) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        destroy = true;
        logDatabaseFailure('database_rollback_failed', rollbackError);
      }
    } else destroy = true;
    // Preserve the operation/commit failure even if rollback fails. Never retry mutations here.
    throw error;
  } finally {
    client.release(destroy);
  }
}
