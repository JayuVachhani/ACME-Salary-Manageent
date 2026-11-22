import { baseApi } from '../../shared/api/base-api';
import type { Reference, Kind, PendingReference } from './types';
const root = '/api/v1/organization-references';
export const referencesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    references: build.query<{ items: Reference[]; total: number }, { kind: Kind; offset: number }>({
      query: ({ kind, offset }) => ({ path: `${root}/${kind}?offset=${offset}` }),
      providesTags: (_data, _error, { kind }) => [{ type: 'References', id: kind }],
    }),
    saveReference: build.mutation<Reference, PendingReference>({
      query: (pending) => ({
        path: `${root}/${pending.kind}${pending.editing ? `/${pending.editing.id}` : ''}`,
        method: pending.editing ? 'PATCH' : 'POST',
        body: pending.editing
          ? {
              name: pending.name,
              isActive: pending.isActive,
              expectedVersion: pending.editing.version,
            }
          : { name: pending.name },
      }),
      invalidatesTags: (_data, error, { kind }) =>
        error ? [] : [{ type: 'References', id: kind }, 'EmployeeFilters', 'Employees'],
    }),
  }),
});
export const { useReferencesQuery, useSaveReferenceMutation } = referencesApi;
