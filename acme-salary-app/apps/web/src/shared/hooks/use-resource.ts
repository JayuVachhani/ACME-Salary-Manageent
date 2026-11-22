import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';

/** One request generation per mounted resource: superseded responses never publish. */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, initial: T) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const refresh = useCallback(async () => {
    const generation = ++sequence.current;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLoading(true); setError('');
    try {
      const next = await load(current.signal);
      if (current.signal.aborted || generation !== sequence.current || !mounted.current) {
        throw new DOMException('Request cancelled', 'AbortError');
      }
      setData(next);
      return next;
    } catch (cause) {
      if (!current.signal.aborted && generation === sequence.current && mounted.current) {
        setError(errorMessage(cause, 'Service unavailable. Please try again.'));
      }
      throw cause;
    } finally {
      if (!current.signal.aborted && generation === sequence.current && mounted.current) setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    mounted.current = true;
    void refresh().catch(() => { /* The current resource's error is rendered by its owner. */ });
    return () => { mounted.current = false; ++sequence.current; controller.current?.abort(); };
  }, [refresh]);
  const reset = useCallback((next: T) => {
    ++sequence.current; controller.current?.abort();
    setData(next); setLoading(false); setError('');
  }, []);
  return { data, loading, error, refresh, reset };
}
