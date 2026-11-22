import { ApiError, requestJson } from '../../shared/api/client';
import type { Identity } from './types';
export const authApi = {
  async identity(signal?: AbortSignal): Promise<Identity | null> {
    try { return await requestJson<Identity>('/api/v1/auth/me', { signal }); }
    catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
  },
  request: (email: string, resend: boolean, signal: AbortSignal) => requestJson<{ challengeId: string; message: string }>(`/api/v1/auth/otp/${resend ? 'resend' : 'request'}`, { method: 'POST', body: { email }, signal }),
  verify: (challengeId: string, code: string, signal: AbortSignal) => requestJson<unknown>('/api/v1/auth/otp/verify', { method: 'POST', body: { challengeId, code }, signal }),
  logout: (signal: AbortSignal) => requestJson<unknown>('/api/v1/auth/logout', { method: 'POST', body: {}, signal }),
};
