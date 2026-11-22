import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useResource } from '../../shared/hooks/use-resource';
import { authApi } from './api';
import type { Identity } from './types';
type Session = { identity: Identity | null; error: string; notice: string; refresh: () => Promise<Identity | null>; clear: (notice: string) => void; clearNotice: () => void };
const SessionContext = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const resource = useResource<Identity | null>(authApi.identity, null);
  const [notice, setNotice] = useState('');
  return <SessionContext value={{ identity: resource.data, error: resource.error, notice, refresh: resource.refresh,
    clear: message => { resource.reset(null); setNotice(message); }, clearNotice: () => setNotice('') }}>{children}</SessionContext>;
}
export function useSession(): Session {
  const value = useContext(SessionContext);
  if (!value) throw new Error('SessionProvider is required');
  return value;
}
