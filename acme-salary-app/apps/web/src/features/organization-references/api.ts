import { requestJson } from '../../shared/api/client';
import type { Reference, Kind, PendingReference } from './types';
const root = '/api/v1/organization-references';
export const referencesApi = {
  list: (kind: Kind, offset: number, signal?: AbortSignal) => requestJson<{ items: Reference[]; total: number }>(`${root}/${kind}?offset=${offset}`, { signal, errorMessage: 'Reference request failed' }),
  save: (pending: PendingReference, signal: AbortSignal) => requestJson<Reference>(`${root}/${pending.kind}${pending.editing ? `/${pending.editing.id}` : ''}`, {
    method: pending.editing ? 'PATCH' : 'POST', signal,
    body: pending.editing ? { name: pending.name, isActive: pending.isActive, expectedVersion: pending.editing.version } : { name: pending.name },
  }),
};
