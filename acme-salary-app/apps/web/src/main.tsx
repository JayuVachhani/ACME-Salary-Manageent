import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [status, setStatus] = useState('Checking service…');
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    fetch('/healthz', { signal: controller.signal }).then(response => {
      if (active) setStatus(response.ok ? 'API is online' : 'API is unavailable');
    }).catch(() => { if (active) setStatus('API is unavailable'); })
      .finally(() => window.clearTimeout(timeout));
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, []);
  return <><a className="skip" href="#main">Skip to content</a>
    <header><div className="brand"><span className="mark">A</span><strong>ACME</strong><span className="product">Salary Management</span></div><span className="environment">Development workspace</span></header>
    <main id="main"><p className="eyebrow">COMPENSATION OPERATIONS</p><h1>A reliable foundation for every salary decision.</h1>
      <p className="intro">Employee records, monthly compensation and a clear history of every change, together in one secure workspace.</p>
      <section className="panel" aria-labelledby="foundation"><div><p className="eyebrow">IMPLEMENTATION IN PROGRESS</p><h2 id="foundation">Application foundation</h2><p>The project is being built module by module. Employee and salary access will become available after authentication and permission checks are verified.</p></div><div className="service"><span className="service-label">Service connection</span><strong role="status">{status}</strong><p>No employee data is displayed.</p></div></section>
      <div className="principles"><section><span>01</span><h2>Controlled access</h2><p>Invite-only access with dedicated salary visibility and export permissions.</p></section><section><span>02</span><h2>Preserved history</h2><p>Monthly salary records retain the reason, effective date and author of every change.</p></section><section><span>03</span><h2>Accurate reporting</h2><p>Country rules and explicit currency conversion support consistent compensation reports.</p></section></div>
    </main><footer>ACME Salary Management · Local development · Synthetic data only</footer></>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
