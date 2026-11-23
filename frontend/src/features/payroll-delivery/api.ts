import { baseApi } from '../../shared/api/base-api';
import { queryString } from '../../shared/api/client';
import type { DeliveryRun, Payslip, Preparation, ManifestEntry, DocumentFile, Page } from './types';
const root = '/api/v1/payroll-delivery';
export const payrollDeliveryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    deliveryRuns: build.query<Page<DeliveryRun>, { period: string; page: number }>({
      query: (q) => ({ path: root + '/runs?' + queryString(q) }),
      providesTags: ['PayrollDelivery', 'Session'],
    }),
    deliveryRun: build.query<DeliveryRun, string>({
      query: (id) => ({ path: root + '/runs/' + id }),
      providesTags: ['PayrollDelivery', 'Session'],
    }),
    finalizedPayslips: build.query<Page<Payslip>, { id: string; page: number }>({
      query: ({ id, page }) => ({ path: `${root}/runs/${id}/payslips?page=${page}` }),
      providesTags: ['PayrollDelivery', 'Session'],
    }),
    finalizedPayslip: build.query<Payslip, { id: string; employeeId: string }>({
      query: ({ id, employeeId }) => ({ path: `${root}/runs/${id}/payslips/${employeeId}` }),
      providesTags: ['PayrollDelivery', 'Session'],
    }),
    paymentPreparations: build.query<Page<Preparation>, { id: string; page: number }>({
      query: ({ id, page }) => ({ path: `${root}/runs/${id}/payment-preparations?page=${page}` }),
      providesTags: ['PayrollDelivery', 'Session'],
    }),
    preparationManifest: build.query<Page<ManifestEntry>, { id: string; page: number }>({
      query: ({ id, page }) => ({
        path: `${root}/payment-preparations/${id}/manifest?page=${page}`,
      }),
      providesTags: ['PayrollDelivery', 'Session'],
    }),
    preparePayment: build.mutation<
      Preparation,
      { id: string; commandId: string; reason: string; confirmed: true }
    >({
      query: ({ id, ...body }) => ({
        path: `${root}/runs/${id}/payment-preparations`,
        method: 'POST',
        body,
        timeoutMs: 30000,
      }),
      invalidatesTags: (_data, error) =>
        !error || error.status === 409 ? ['PayrollDelivery'] : [],
    }),
    reportExternalPayment: build.mutation<
      Preparation,
      {
        id: string;
        commandId: string;
        externalReference: string;
        paymentDate: string;
        reason: string;
        confirmed: true;
      }
    >({
      query: ({ id, ...body }) => ({
        path: `${root}/payment-preparations/${id}/external-payment`,
        method: 'POST',
        body,
        timeoutMs: 20000,
      }),
      invalidatesTags: (_data, error) =>
        !error || error.status === 409 ? ['PayrollDelivery'] : [],
    }),
    downloadPayslip: build.mutation<
      DocumentFile,
      { id: string; employeeId: string; commandId: string; confirmed: true }
    >({
      query: ({ id, employeeId, ...body }) => ({
        path: `${root}/runs/${id}/payslips/${employeeId}/download`,
        method: 'POST',
        body,
        timeoutMs: 20000,
      }),
    }),
    downloadManifest: build.mutation<
      DocumentFile,
      { id: string; commandId: string; confirmed: true }
    >({
      query: ({ id, ...body }) => ({
        path: `${root}/payment-preparations/${id}/download`,
        method: 'POST',
        body,
        timeoutMs: 30000,
      }),
    }),
  }),
});
