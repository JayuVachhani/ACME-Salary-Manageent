/** Link a local workflow's cancellation to an RTK Query request without storing AbortSignal in Redux. */
export async function runRequest<T>(
  request: { abort: () => void; unwrap: () => Promise<T> },
  signal: AbortSignal,
): Promise<T> {
  const abort = () => request.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  try {
    return await request.unwrap();
  } finally {
    signal.removeEventListener('abort', abort);
  }
}
