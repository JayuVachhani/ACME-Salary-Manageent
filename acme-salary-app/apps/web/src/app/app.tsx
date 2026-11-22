import { lazy, Suspense } from 'react';
import { Login, useSession } from '../features/auth';
import { AppProviders } from './providers';
import { useApiHealth } from './use-api-health';

const Workspace = lazy(() => import('./workspace').then(module => ({ default: module.Workspace })));

function AppContent() {
 const status = useApiHealth();
 const session = useSession();
 return <><a className="skip" href="#main">Skip to content</a>
    <header><div className="brand"><span className="mark">A</span><strong>ACME</strong><span className="product">Salary Management</span></div><span className="environment">Development workspace</span></header>
    <main id="main"><p className="eyebrow">COMPENSATION OPERATIONS</p><h1>A reliable foundation for every salary decision.</h1>
      <p className="intro">Employee records, monthly compensation and a clear history of every change, together in one secure workspace.</p>
      <section className="panel" aria-labelledby="foundation"><div><p className="eyebrow">IMPLEMENTATION IN PROGRESS</p><h2 id="foundation">Application foundation</h2><p>Employee directory and administration features are available after sign-in according to your permissions. Salary, approval and reporting workflows remain in development.</p></div><div className="service"><span className="service-label">Service connection</span><strong role="status">{status}</strong><p>{session.identity ? 'Your permissions control the workspace below.' : 'Sign in to access your permitted workspace.'}</p></div></section>
      <div className="principles"><section><span>01</span><h2>Controlled access</h2><p>Invite-only access with dedicated salary visibility and export permissions.</p></section><section><span>02</span><h2>Preserved history</h2><p>Monthly salary records retain the reason, effective date and author of every change.</p></section><section><span>03</span><h2>Accurate reporting</h2><p>Country rules and explicit currency conversion support consistent compensation reports.</p></section></div>
      <Login />{session.identity && <Suspense fallback={<p role="status">Loading workspace…</p>}><Workspace /></Suspense>}
    </main><footer>ACME Salary Management · Local development · Synthetic data only</footer></>;
}
export function App() { return <AppProviders><AppContent /></AppProviders>; }
