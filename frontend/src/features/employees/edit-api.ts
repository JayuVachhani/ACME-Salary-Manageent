import { requestJson } from '../../shared/api/client';
export type EditLease = { leaseToken: string; expiresAt: string; version: number };
export const employeeEditApi = {
  acquire: (id: string, expectedVersion: number, signal: AbortSignal) =>
    requestJson<EditLease>(`/api/v1/employees/${id}/edit-lease`, {
      method: 'POST',
      body: { expectedVersion },
      signal,
    }),
  renew: (id: string, leaseToken: string, signal: AbortSignal) =>
    requestJson<EditLease>(`/api/v1/employees/${id}/edit-lease/renew`, {
      method: 'POST',
      body: { leaseToken },
      signal,
    }),
  release: (id: string, leaseToken: string) =>
    requestJson<unknown>(`/api/v1/employees/${id}/edit-lease/release`, {
      method: 'POST',
      body: { leaseToken },
    }),
  save: (
    id: string,
    body: {
      leaseToken: string;
      expectedVersion: number;
      firstName: string;
      lastName: string;
      email: string;
      reason: string;
      confirmed: true;
    },
    signal: AbortSignal,
  ) => requestJson<unknown>(`/api/v1/employees/${id}`, { method: 'PATCH', body, signal }),
};
