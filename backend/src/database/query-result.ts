import type { QueryResult, QueryResultRow } from 'pg';
/** Use only when SQL guarantees a row (COUNT/aggregate/RETURNING), not for business "not found". */
export function requiredRow<R extends QueryResultRow>(result: QueryResult<R>): R {
  const row = result.rows[0];
  if (!row) throw new Error('Expected database result is unavailable');
  return row;
}
