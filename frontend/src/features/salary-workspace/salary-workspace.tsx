import { useSalaryWorkspace } from './use-salary-workspace';
import { SalaryWorkspaceFilters } from './ui/salary-workspace-filters';
import { SalaryWorkspaceResults } from './ui/salary-workspace-results';
import { Button } from '../../shared/ui/button';
import './salary-workspace.css';

export function SalaryWorkspace({ onOpenSalary }: { onOpenSalary: (employeeId: string) => void }) {
  const model = useSalaryWorkspace();
  return (
    <section className="team-panel salary-workspace" aria-labelledby="salary-workspace-heading">
      <div className="salary-section-heading">
        <h2 id="salary-workspace-heading">Employee salaries</h2>
        <Button variant="secondary" disabled={model.loading} onClick={model.refresh}>
          Refresh salaries
        </Button>
      </div>
      <p>
        Find an employee, see their current and upcoming monthly salary, and open their salary
        details to make a change.
      </p>
      <SalaryWorkspaceFilters model={model} />
      <SalaryWorkspaceResults model={model} onOpenSalary={onOpenSalary} />
    </section>
  );
}
