import { requestJson } from '../../shared/api/client';
import type { Account, MemberInput } from './types';
const root = '/api/v1/team';
export const teamApi = {
  list: (offset: number, signal?: AbortSignal) => requestJson<{ items: Account[]; total: number }>(`${root}?offset=${offset}`, { signal, timeoutMs: 20000, errorMessage: 'Team request failed' }),
  invite: (body: MemberInput & { email: string }, signal: AbortSignal) => requestJson<{ account: Account; delivery: string }>(root, { method: 'POST', body, signal, timeoutMs: 20000 }),
  change: (id: string, body: MemberInput & { expectedVersion: number }, signal: AbortSignal) => requestJson<Account>(`${root}/${id}`, { method: 'PATCH', body, signal, timeoutMs: 20000 }),
  remove: (account: Account, signal: AbortSignal) => requestJson<unknown>(`${root}/${account.id}`, { method: 'DELETE', body: { expectedVersion: account.team_version }, signal, timeoutMs: 20000 }),
  reinvite: (account: Account, signal: AbortSignal) => requestJson<{ account: Account; delivery: string }>(`${root}/${account.id}/reinvite`, { method: 'POST', body: { expectedVersion: account.team_version }, signal, timeoutMs: 20000 }),
};
