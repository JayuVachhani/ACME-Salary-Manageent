import { afterEach, describe, expect, it, vi } from 'vitest';
import { store, sessionCleared } from '../state/store';
import { baseApi } from './base-api';
import { refreshSession } from './session';
import { employeesApi } from '../../features/employees/api';
import { referencesApi } from '../../features/organization-references/api';

const subscriptions: { unsubscribe: () => void }[] = [];
afterEach(() => {
  subscriptions.splice(0).forEach((request) => request.unsubscribe());
  store.dispatch(baseApi.util.resetApiState());
  vi.unstubAllGlobals();
});
describe('protected API cache lifecycle', () => {
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
