import { requestJson } from './client';
import type { SalaryDraftCommand, SalaryPreview, SalaryWriteResult } from './salary-contract';

/** Lease and preview credentials stay in local workflow memory, outside Redux actions/cache. */
export const salaryWriteApi = {
  preview: (id: string, body: SalaryDraftCommand, signal: AbortSignal) =>
    requestJson<SalaryPreview>(`/api/v1/employees/${id}/salary/preview`, {
      method: 'POST',
      body,
      signal,
      timeoutMs: 20000,
    }),
  submit: (
    id: string,
    body: SalaryDraftCommand & { previewHash: string; confirmed: true },
    signal: AbortSignal,
  ) =>
    requestJson<SalaryWriteResult>(`/api/v1/employees/${id}/salary`, {
      method: 'POST',
      body,
      signal,
      timeoutMs: 20000,
    }),
};
