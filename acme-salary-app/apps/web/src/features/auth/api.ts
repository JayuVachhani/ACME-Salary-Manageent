// OTP codes are sent directly through the shared transport, never through Redux actions or cache.
import { baseApi } from '../../shared/api/base-api';
import { requestJson } from '../../shared/api/client';
export const authApi = {
  request: (email: string, resend: boolean, signal: AbortSignal) => requestJson<{ challengeId: string; message: string }>(`/api/v1/auth/otp/${resend ? 'resend' : 'request'}`, { method: 'POST', body: { email }, signal }),
  verify: (challengeId: string, code: string, signal: AbortSignal) => requestJson<unknown>('/api/v1/auth/otp/verify', { method: 'POST', body: { challengeId, code }, signal }),
};

const authEndpoints = baseApi.injectEndpoints({ endpoints: build => ({
  logout: build.mutation<unknown, void>({ query: () => ({ path: '/api/v1/auth/logout', method: 'POST', body: {} }) }),
}) });
export const { useLogoutMutation } = authEndpoints;
