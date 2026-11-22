export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: object;
  signal?: AbortSignal;
  timeoutMs?: number;
  errorMessage?: string;
};

function csrfToken(): string {
  return (
    document.cookie
      .split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith('acme_csrf='))
      ?.slice(10) ?? ''
  );
}

function request(path: string, options: RequestOptions): Promise<Response> {
  if (
    !path.startsWith('/') ||
    new URL(path, 'https://same-origin.invalid').origin !== 'https://same-origin.invalid'
  )
    throw new Error('Requests must use a same-origin path');
  const { method = 'GET', body, signal, timeoutMs = 15000 } = options;
  const timeout = AbortSignal.timeout(timeoutMs);
  return fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' ? { 'X-CSRF-Token': csrfToken() } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
}

/** Feature APIs own response types; this boundary owns transport and safe errors. */
export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options);
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      options.errorMessage ?? 'Service unavailable. Please try again.',
      response.status,
    );
  }
  if (!response.ok) {
    const message =
      response.status >= 500
        ? 'Service unavailable. Please try again.'
        : data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
          ? data.message
          : (options.errorMessage ?? 'Request failed. Please try again.');
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export async function serviceOnline(signal: AbortSignal): Promise<boolean> {
  return (await request('/healthz', { signal, timeoutMs: 8000 })).ok;
}

export function queryString(values: Record<string, string | number | undefined>): string {
  return new URLSearchParams(
    Object.entries(values)
      .filter(([, value]) => value !== '' && value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  ).toString();
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError) return fallback;
  if (error instanceof DOMException && error.name === 'TimeoutError')
    return 'Service unavailable. Please try again.';
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string')
    return error.message;
  return fallback;
}
