import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, queryString, requestJson } from './client';

afterEach(() => vi.unstubAllGlobals());

describe('same-origin API transport', () => {
  it('reads the current CSRF token for each mutation and sends decimal text unchanged', async () => {
    const cookies = { cookie: 'another=value; acme_csrf=first' };
    vi.stubGlobal('document', cookies);
    const fetcher = vi.fn().mockImplementation(async () => new Response('{}'));
    vi.stubGlobal('fetch', fetcher);
    await requestJson('/api/v1/fx-rates', { method: 'POST', body: { rate: '0.12345678' } });
    cookies.cookie = 'acme_csrf=second';
    await requestJson('/api/v1/team', { method: 'DELETE', body: { expectedVersion: 7 } });
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ credentials: 'same-origin', headers: { 'X-CSRF-Token': 'first' }, body: '{"rate":"0.12345678"}' });
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({ headers: { 'X-CSRF-Token': 'second' }, body: '{"expectedVersion":7}' });
  });

  it('preserves server conflict messages and exposes the status to session handling', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"message":"Refresh and review"}', { status: 409 })));
    await expect(requestJson('/api/v1/team')).rejects.toMatchObject({ message: 'Refresh and review', status: 409 });
  });

  it('uses safe fallback errors for non-JSON responses and non-string server messages', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('<html>internal detail</html>', { status: 502 }))
      .mockResolvedValueOnce(new Response('{"message":{"internal":"detail"}}', { status: 503 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(requestJson('/api/v1/employees', { errorMessage: 'Employee request failed' })).rejects.toThrow('Employee request failed');
    await expect(requestJson('/api/v1/employees')).rejects.toThrow('Service unavailable. Please try again.');
  });

  it('forwards cancellation and does not attach CSRF headers to reads', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn(async (_path: string, options: RequestInit) => {
      expect(options.headers).toEqual({});
      expect(options.signal?.aborted).toBe(true);
      throw options.signal?.reason;
    });
    vi.stubGlobal('fetch', fetcher);
    controller.abort(new DOMException('Cancelled', 'AbortError'));
    await expect(requestJson('/api/v1/employees', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('never sends credentials or CSRF tokens to an external destination', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    for (const path of ['https://example.test/api', '//example.test/api', '/\\example.test/api', '/\t/example.test/api']) {
      await expect(requestJson(path)).rejects.toThrow('same-origin');
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('preserves query values and returns API errors as real errors', () => {
    expect(queryString({ search: '100% _ \\ +', page: 2, country: '', department: undefined })).toBe('search=100%25+_+%5C+%2B&page=2');
    expect(new ApiError('Sign in required', 401)).toBeInstanceOf(Error);
  });
});
