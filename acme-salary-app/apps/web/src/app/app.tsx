import { Login, SessionProvider } from '../features/auth';
import { Workspace } from './workspace';
import { useApiHealth } from './use-api-health';
function AppContent() {
 const status = useApiHealth();
 return <><a className="skip" href="#main">Skip to content</a>
    <header><div className="brand"><span className="mark">A</span><strong>ACME</strong><span className="product">Salary Management</span></div><span className="environment">Development workspace</span></header>
    <main id="main"><p className="eyebrow">COMPENSATION OPERATIONS</p><h1>A reliable foundation for every salary decision.</h1>
      <p className="intro">Employee records, monthly compensation and a clear history of every change, together in one secure workspace.</p>
      <section className="panel" aria-labelledby="foundation"><div><p className="eyebrow">IMPLEMENTATION IN PROGRESS</p><h2 id="foundation">Application foundation</h2><p>The project is being built module by module. Employee and salary access will become available after authentication and permission checks are verified.</p></div><div className="service"><span className="service-label">Service connection</span><strong role="status">{status}</strong><p>No employee data is displayed.</p></div></section>
      <div className="principles"><section><span>01</span><h2>Controlled access</h2><p>Invite-only access with dedicated salary visibility and export permissions.</p></section><section><span>02</span><h2>Preserved history</h2><p>Monthly salary records retain the reason, effective date and author of every change.</p></section><section><span>03</span><h2>Accurate reporting</h2><p>Country rules and explicit currency conversion support consistent compensation reports.</p></section></div>
      <Login /><Workspace />
    </main><footer>ACME Salary Management · Local development · Synthetic data only</footer></>;
}
export function App() { return <SessionProvider><AppContent /></SessionProvider>; }
