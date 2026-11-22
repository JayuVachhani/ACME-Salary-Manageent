import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { withTransaction } from './transaction';

describe('transaction failure ownership', () => {
  it('commits a null result so failed OTP attempts are not rolled back', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
    const release = vi.fn();
    const pool = { connect: async () => ({ query, release }) } as unknown as Pool;
    expect(await withTransaction(pool, async () => null)).toBeNull();
    expect(query.mock.calls.map((call) => call[0])).toEqual(['BEGIN', 'COMMIT']);
    expect(release).toHaveBeenCalledWith(false);
  });
  it('preserves the original failure and destroys the client when rollback also fails', async () => {
    const original = new Error('work failed');
    const query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql === 'ROLLBACK') throw new Error('rollback failed');
    });
    const release = vi.fn();
    const pool = { connect: async () => ({ query, release }) } as unknown as Pool;
    await expect(
      withTransaction(pool, async () => {
        throw original;
      }),
    ).rejects.toBe(original);
    expect(query.mock.calls.map((call) => call[0])).toEqual(['BEGIN', 'ROLLBACK']);
    expect(release).toHaveBeenCalledWith(true);
  });
  it('rolls back a failed commit without retrying the work', async () => {
    const failure = new Error('commit failed');
    const query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql === 'COMMIT') throw failure;
    });
    const release = vi.fn();
    const pool = { connect: async () => ({ query, release }) } as unknown as Pool;
    const work = vi.fn().mockResolvedValue('result');
    await expect(withTransaction(pool, work)).rejects.toBe(failure);
    expect(work).toHaveBeenCalledTimes(1);
    expect(query.mock.calls.map((call) => call[0])).toEqual(['BEGIN', 'COMMIT', 'ROLLBACK']);
    expect(release).toHaveBeenCalledWith(false);
  });
});
