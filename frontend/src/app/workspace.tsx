import { useEffect, useRef } from 'react';
import { useSession } from '../features/auth';
import { Team } from '../features/team';
import { OrganizationReferences } from '../features/organization-references';
import { CountryCurrency } from '../features/country-currency';
import { Employees, EmployeeCreate } from '../features/employees';
import { SalaryApprovals } from '../features/salary-approvals';
import { FxRates } from '../features/fx-rates';
import { useWorkspaceLocation, workspacePages, workspaceGroups } from './workspace-navigation';
export function Workspace() {
  const session = useSession();
  const location = useWorkspaceLocation();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [location]);
  const identity = session.identity;
  if (!identity) return null;
  const canRead = identity.isHrManager || identity.permissions.includes('read');
  const canCreate =
    identity.isHrManager ||
    ['read', 'write', 'salary:view'].every((permission) =>
      identity.permissions.includes(permission),
    );
  const pages = workspacePages.filter(
    (page) =>
      page.id === 'home' ||
      (page.id === 'add-employee' ? canCreate : page.managerOnly ? identity.isHrManager : canRead),
  );
  const current = pages.find((page) => location === '/' + page.id);
  return (
    <div className="workspace-shell">
      <aside className="sidebar">
        <p className="nav-label">YOUR WORKSPACE</p>
        <nav aria-label="Main navigation">
          {workspaceGroups.map((group) => {
            const visible = pages.filter((page) =>
              (group.pages as readonly string[]).includes(page.id),
            );
            if (!visible.length) return null;
            return (
              <section className="nav-group" key={group.label} aria-label={group.label}>
                <h2>{group.label}</h2>
                {visible.map((page) => (
                  <a
                    key={page.id}
                    href={'#/' + page.id}
                    aria-current={current?.id === page.id ? 'page' : undefined}
                  >
                    <span className="nav-symbol" aria-hidden="true">
                      {page.symbol}
                    </span>
                    {page.label}
                  </a>
                ))}
              </section>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <strong>Need to change access?</strong>
          <p>Ask an HR manager to update your permissions.</p>
        </div>
      </aside>
      <main id="main" tabIndex={-1} className="workspace-main">
        <div className="page-heading">
          <p className="eyebrow">ACME WORKSPACE</p>
          <h1 ref={heading} tabIndex={-1}>
            {current?.label ?? 'Page unavailable'}
          </h1>
          <p>
            {current?.description ??
              'This page does not exist or is not available with your access.'}
          </p>
        </div>
        {!current && (
          <a className="text-link" href="#/home">
            Go to Home →
          </a>
        )}
        {current?.id === 'home' && (
          <>
            <section className="welcome-card" aria-labelledby="welcome-heading">
              <span className="welcome-icon" aria-hidden="true">
                A
              </span>
              <div>
                <p className="eyebrow">LET’S GET STARTED</p>
                <h2 id="welcome-heading">Welcome to your HR workspace</h2>
                <p>Choose a task below. You can return here anytime using Home.</p>
              </div>
            </section>
            <h2 className="section-heading">What would you like to do?</h2>
            {workspaceGroups
              .filter((group) => group.label !== 'Overview')
              .map((group) => {
                const visible = pages.filter((page) =>
                  (group.pages as readonly string[]).includes(page.id),
                );
                if (!visible.length) return null;
                return (
                  <section className="home-task-group" key={group.label} aria-label={group.label}>
                    <h2 className="section-heading">{group.label}</h2>
                    <div className="task-grid">
                      {visible.map((page) => (
                        <a className="task-card" key={page.id} href={'#/' + page.id}>
                          <span className="task-icon" aria-hidden="true">
                            {page.symbol}
                          </span>
                          <h3>{page.label}</h3>
                          <p>{page.description}</p>
                          <span className="task-link">
                            Open page <span aria-hidden="true">→</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </section>
                );
              })}
            {pages.length === 1 && (
              <p>
                Your account does not have access to these tools yet. Ask an HR manager for help.
              </p>
            )}
            <p className="availability-note">
              Monthly salary revisions, transfers and reports are not available yet.
            </p>
          </>
        )}
        {current?.id === 'employees' && <Employees />}
        {current?.id === 'add-employee' && <EmployeeCreate />}
        {current?.id === 'salary-approvals' && <SalaryApprovals />}
        {current?.id === 'organization' && <OrganizationReferences />}
        {current?.id === 'team' && (
          <Team
            userId={identity.id}
            onSelfRemoved={() => session.clear('Your access was removed.')}
          />
        )}
        {current?.id === 'countries' && <CountryCurrency isHrManager={identity.isHrManager} />}
        {current?.id === 'exchange-rates' && <FxRates isHrManager={identity.isHrManager} />}
      </main>
    </div>
  );
}
