import { lazy, Suspense } from 'react';
import { Login, useSession, AccountMenu } from '../features/auth';
import { AppProviders } from './providers';
import { useApiHealth } from './use-api-health';
const Workspace = lazy(() =>
  import('./workspace').then((module) => ({ default: module.Workspace })),
);
function AppContent() {
  const status = useApiHealth();
  const session = useSession();
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="app-header">
        <div className="brand">
          <span className="mark">A</span>
          <div>
            <strong>ACME</strong>
            <span className="product">HR workspace</span>
          </div>
        </div>
        <div className="header-tools">
          <span className="connection-status" role="status">
            {status === 'API is online'
              ? 'Connected'
              : status === 'API is unavailable'
                ? 'Connection unavailable'
                : 'Connecting…'}
          </span>
          {session.identity && <AccountMenu />}
        </div>
      </header>
      {session.identity ? (
        <Suspense
          fallback={
            <main id="main" tabIndex={-1}>
              <p role="status">Opening your workspace…</p>
            </main>
          }
        >
          <Workspace />
        </Suspense>
      ) : (
        <main id="main" tabIndex={-1} className="sign-in-page">
          <div className="sign-in-intro">
            <p className="eyebrow">WELCOME TO ACME</p>
            <h1>
              Your HR work,
              <br />a little simpler.
            </h1>
            <p>Find employee details and manage your organization in one place.</p>
            <div className="sign-in-tip">
              <strong>No password to remember</strong>
              <p>We’ll email you a sign-in code. Only invited colleagues can sign in.</p>
            </div>
          </div>
          <Login />
        </main>
      )}
      <footer className="app-footer">ACME · Local testing · Use sample data only</footer>
    </>
  );
}
export function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
