import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';
import { handleDirectRequestError } from '../api/direct-request-errors';
import { useAppDispatch } from '../state/hooks';
import { notify } from '../state/notifications';
import type { FeedbackTone } from '../state/notifications';
import type { LocalFeedback } from '../state/notifications';

/** Local workflow lock/cancellation. Remote data and request caching remain RTK Query-owned. */
export function useAction() {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<LocalFeedback | null>(null);
  const current = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      current.current?.abort();
    };
  }, []);
  const setMessage = useCallback((message: string, tone: FeedbackTone = 'info') => {
    setFeedback(message ? { message, tone } : null);
  }, []);
  const announce = useCallback(
    (message: string, tone: FeedbackTone = 'success') => {
      if (!mounted.current) return;
      setFeedback(null);
      dispatch(notify({ message, tone }));
    },
    [dispatch],
  );
  const perform = useCallback(
    async (work: (signal: AbortSignal) => Promise<void>) => {
      if (current.current) return;
      const controller = new AbortController();
      current.current = controller;
      setBusy(true);
      setFeedback(null);
      try {
        await work(controller.signal);
      } catch (cause) {
        if (mounted.current && !controller.signal.aborted) {
          handleDirectRequestError(cause, dispatch);
          dispatch(
            notify({
              tone: 'error',
              message: errorMessage(
                cause,
                'Could not confirm the result. Refresh before retrying.',
              ),
            }),
          );
        }
      } finally {
        if (mounted.current && current.current === controller) setBusy(false);
        if (current.current === controller) current.current = null;
      }
    },
    [dispatch],
  );
  return { busy, feedback, setMessage, announce, perform };
}
