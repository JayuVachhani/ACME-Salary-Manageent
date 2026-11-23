import { payrollPolicyApi } from '../../features/payroll-policies/api';
import { payrollCalculationsApi } from '../../features/payroll-calculations/api';
import { payrollRunsApi } from '../../features/payroll-runs/api';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { store, sessionCleared } from '../state/store';
import { baseApi } from './base-api';
import { refreshSession } from './session';
import { employeesApi } from '../../features/employees/api';
import { referencesApi } from '../../features/organization-references/api';
import { employeeEditApi } from '../../features/employees/edit-api';
import { ApiError } from './client';
import { handleDirectRequestError } from './direct-request-errors';

const subscriptions: { unsubscribe: () => void }[] = [];
afterEach(() => {
  subscriptions.splice(0).forEach((request) => request.unsubscribe());
  store.dispatch(baseApi.util.resetApiState());
  vi.unstubAllGlobals();
});
describe('protected API cache lifecycle', () => {
  it('refreshes calculator and run policy options after independent policy activation', async () => {
    let version = 1;
    let policyReads = 0;
    let setupReads = 0;
    vi.stubGlobal('document', { cookie: 'acme_csrf=synthetic' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        if (path.startsWith('/api/v1/payroll-policies?')) {
          policyReads++;
          return new Response(
            JSON.stringify({
              items: [{ id: 'policy', version, status: 'ACTIVE' }],
              total: 1,
              page: 1,
              pageSize: 25,
            }),
          );
        }
        if (path.startsWith('/api/v1/payroll-runs/setup?')) {
          setupReads++;
          return new Response(JSON.stringify({ policy: { version }, candidates: [] }));
        }
        version = 2;
        return new Response(JSON.stringify({ id: 'policy', version, status: 'ACTIVE' }));
      }),
    );
    const calculator = store.dispatch(
      payrollCalculationsApi.endpoints.calculationPolicies.initiate(1),
    );
    const options = store.dispatch(payrollRunsApi.endpoints.runPolicyChoices.initiate(1));
    const setup = store.dispatch(
      payrollRunsApi.endpoints.runSetup.initiate({ period: '2026-04', policyId: 'policy' }),
    );
    subscriptions.push(calculator, options, setup);
    await Promise.all([calculator.unwrap(), options.unwrap(), setup.unwrap()]);
    expect(policyReads).toBe(2);
    expect(setupReads).toBe(1);
    await store
      .dispatch(
        payrollPolicyApi.endpoints.approvePayrollPolicy.initiate({
          id: 'policy',
          comment: 'Independent activation',
          confirmed: true,
        }),
      )
      .unwrap();
    await vi.waitFor(() => {
      expect(policyReads).toBe(4);
      expect(setupReads).toBe(2);
      expect(
        payrollCalculationsApi.endpoints.calculationPolicies.select(1)(store.getState()).data
          ?.items[0]?.version,
      ).toBe(2);
    });
  });
  it('clears protected cache and identity after a direct lease request returns 401', async () => {
    vi.stubGlobal('document', { cookie: 'acme_csrf=synthetic' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"message":"Sign in required"}', { status: 401 })),
    );
    await store.dispatch(
      baseApi.util.upsertQueryData('session', undefined, {
        id: 'synthetic',
        isHrManager: true,
        permissions: ['read'],
      }),
    );
    await store.dispatch(
      employeesApi.util.upsertQueryData(
        'employees',
        {
          search: '',
          country: '',
          department: '',
          status: '',
          sort: 'code',
          direction: 'asc',
          pageSize: '25',
          page: 1,
        },
        { items: [], total: 7 },
      ),
    );
    const dispatch = vi.fn(store.dispatch);
    await employeeEditApi
      .acquire('synthetic', 1, new AbortController().signal)
      .catch((cause) => handleDirectRequestError(cause, dispatch));
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([{ type: 'session/expired' }]);
    expect(
      Object.keys(store.getState().api.queries).some((key) => key.startsWith('employees(')),
    ).toBe(false);
    await vi.waitFor(() =>
      expect(baseApi.endpoints.session.select()(store.getState()).data ?? null).toBeNull(),
    );
  });
  it('refreshes current permissions after a direct lease renewal returns 403', async () => {
    vi.stubGlobal('document', { cookie: 'acme_csrf=synthetic' });
    let reads = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        if (path === '/api/v1/auth/me') {
          reads++;
          return new Response(
            JSON.stringify({
              id: 'synthetic',
              isHrManager: false,
              permissions: reads === 1 ? ['read', 'edit'] : [],
            }),
          );
        }
        return new Response('{"message":"Access changed"}', { status: 403 });
      }),
    );
    const session = store.dispatch(baseApi.endpoints.session.initiate());
    subscriptions.push(session);
    await session.unwrap();
    const dispatch = vi.fn(store.dispatch);
    await employeeEditApi
      .renew('synthetic', 'synthetic-local-lease', new AbortController().signal)
      .catch((cause) => handleDirectRequestError(cause, dispatch));
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      { type: 'session/accessDenied' },
    ]);
    await vi.waitFor(() =>
      expect(baseApi.endpoints.session.select()(store.getState()).data?.permissions).toEqual([]),
    );
    expect(reads).toBe(2);
  });
  it('does not duplicate RTK Query auth events or expire sessions on other direct failures', () => {
    const dispatch = vi.fn(store.dispatch);
    for (const cause of [
      { status: 401, message: 'Already handled by RTK Query' },
      { status: 403, message: 'Already handled by RTK Query' },
      new ApiError('Refresh and review', 409),
      new TypeError('Network unavailable'),
    ])
      handleDirectRequestError(cause, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
  it('refreshes employee labels after a successful reference change but not a conflict', async () => {
    let reads = 0;
    let status = 200;
    vi.stubGlobal('document', { cookie: 'acme_csrf=synthetic' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        if (path.startsWith('/api/v1/employees?')) {
          reads++;
          return new Response('{"items":[],"total":0}');
        }
        return new Response(
          status === 200
            ? '{"id":"synthetic","name":"Renamed","is_active":true,"version":2}'
            : '{"message":"Refresh and review"}',
          { status },
        );
      }),
    );
    const query = store.dispatch(
      employeesApi.endpoints.employees.initiate({
        search: '',
        country: '',
        department: '',
        status: '',
        sort: 'code',
        direction: 'asc',
        pageSize: '25',
        page: 1,
      }),
    );
    subscriptions.push(query);
    await query.unwrap();
    const input = {
      kind: 'departments' as const,
      name: 'Renamed',
      isActive: true,
      editing: { id: 'synthetic', name: 'Old', is_active: true, version: 1 },
    };
    await store.dispatch(referencesApi.endpoints.saveReference.initiate(input)).unwrap();
    await vi.waitFor(() => expect(reads).toBe(2));
    status = 409;
    await expect(
      store.dispatch(referencesApi.endpoints.saveReference.initiate(input)).unwrap(),
    ).rejects.toMatchObject({ status: 409 });
    expect(reads).toBe(2);
  });
  it('starts a fresh identity read after cancelling a pending anonymous startup read', async () => {
    let calls = 0;
    let cancelled = false;
    vi.stubGlobal(
      'fetch',
      vi.fn((_path: string, options: RequestInit) => {
        calls++;
        if (calls === 1)
          return new Promise<Response>((_resolve, reject) => {
            options.signal?.addEventListener(
              'abort',
              () => {
                cancelled = true;
                reject(options.signal?.reason);
              },
              { once: true },
            );
          });
        return Promise.resolve(
          new Response('{"id":"synthetic","isHrManager":false,"permissions":["read"]}'),
        );
      }),
    );
    const startup = store.dispatch(baseApi.endpoints.session.initiate());
    subscriptions.push(startup);
    await vi.waitFor(() => expect(calls).toBe(1));
    await expect(refreshSession(store.dispatch)).resolves.toMatchObject({ id: 'synthetic' });
    expect(cancelled).toBe(true);
    expect(calls).toBe(2);
  });
  it('clears employee data and cached identity on local session removal', async () => {
    const query = store.dispatch(
      employeesApi.util.upsertQueryData('employee', 'synthetic', {
        id: 'synthetic',
        employee_code: 'SYN-1',
        email: 'synthetic@acme.test',
        first_name: 'Synthetic',
        last_name: 'Person',
        joining_date: '2026-01-01',
        version: 1,
        country_code: null,
        country_name: null,
        department: null,
        designation: null,
        employment_status: null,
      }),
    );
    await query;
    await store.dispatch(
      baseApi.util.upsertQueryData('session', undefined, {
        id: 'synthetic',
        isHrManager: false,
        permissions: ['read'],
      }),
    );
    expect(baseApi.endpoints.session.select()(store.getState()).data?.id).toBe('synthetic');
    store.dispatch(sessionCleared('Signed out.'));
    expect(
      employeesApi.endpoints.employee.select('synthetic')(store.getState()).data,
    ).toBeUndefined();
    await vi.waitFor(() =>
      expect(baseApi.endpoints.session.select()(store.getState()).data ?? null).toBeNull(),
    );
  });
});
