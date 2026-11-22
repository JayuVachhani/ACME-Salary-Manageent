import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const current = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; current.current?.abort(); };
  }, []);
  const perform = useCallback(async (work: (signal: AbortSignal) => Promise<void>) => {
    // A second click must not schedule another mutation before React renders disabled controls.
    if (current.current) return;
    const controller = new AbortController(); current.current = controller;
    setBusy(true); setMessage('');
    try { await work(controller.signal); }
    catch (cause) {
      if (mounted.current && !controller.signal.aborted) {
        setMessage(errorMessage(cause, 'Could not confirm the result. Refresh before retrying.'));
      }
    } finally {
      if (mounted.current && !controller.signal.aborted) setBusy(false);
      current.current = null;
    }
  }, []);
  return { busy, message, setMessage, perform };
}
