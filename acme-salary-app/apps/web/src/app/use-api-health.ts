import { useEffect, useState } from 'react';
import { serviceOnline } from '../shared/api/client';
export function useApiHealth() {
  const [status, setStatus] = useState('Checking service…');
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    // The UI deadline remains a window timer, including under browser clock controls.
    const deadline = window.setTimeout(() => { controller.abort(); if (active) setStatus('API is unavailable'); }, 8000);
    serviceOnline(controller.signal).then(online => { if (active) setStatus(online ? 'API is online' : 'API is unavailable'); })
      .catch(() => { if (active) setStatus('API is unavailable'); }).finally(() => window.clearTimeout(deadline));
    return () => { active = false; window.clearTimeout(deadline); controller.abort(); };
  }, []);
  return status;
}
