import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '../shared/state/store';
import { ErrorBoundary } from '../shared/ui/error-boundary';
import { Notifications } from '../shared/ui/notifications';
export function AppProviders({ children }: { children: ReactNode }) {
  return <ErrorBoundary><Provider store={store}><Notifications />{children}</Provider></ErrorBoundary>;
}
