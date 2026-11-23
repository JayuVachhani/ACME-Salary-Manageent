import { useEmployeeDetails } from '../use-employee-details';
import { RequestState } from '../../../shared/ui/request-state';
import { Button } from '../../../shared/ui/button';
import { Modal } from '../../../shared/ui/modal';
import { Tabs } from '../../../shared/ui/tabs';
import { EmployeeSalary } from './employee-salary';
import { EmployeeEditor } from './employee-editor';
export function EmployeeProfile({
  id,
  onClose,
  initialTab = 'details',
}: {
  id: string;
  onClose: () => void;
  initialTab?: 'details' | 'salary';
}) {
  const {
    editing,
    setEditing,
    salaryEditing,
    setSalaryEditing,
    tab,
    setTab,
    canViewSalary,
    canEdit,
    selected,
    loading,
    error,
  } = useEmployeeDetails(id, initialTab);
  const details = selected && (
    <>
      <section className="profile-section" aria-labelledby="profile-personal-heading">
        <h3 id="profile-personal-heading">Personal details</h3>
        <dl className="profile-details">
          <div>
            <dt>Employee code</dt>
            <dd>{selected.employee_code}</dd>
          </div>
          <div>
            <dt>Full name</dt>
            <dd>
              {selected.first_name} {selected.last_name}
            </dd>
          </div>
          <div>
            <dt>Work email</dt>
            <dd>{selected.email}</dd>
          </div>
          <div>
            <dt>Joining date</dt>
            <dd>
              {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(
                new Date(selected.joining_date + 'T00:00:00Z'),
              )}
            </dd>
          </div>
        </dl>
      </section>
      <section className="profile-section" aria-labelledby="profile-assignment-heading">
        <h3 id="profile-assignment-heading">Current assignment</h3>
        <dl className="profile-details">
          <div>
            <dt>Country / region</dt>
            <dd>{selected.country_name ?? 'Not assigned yet'}</dd>
          </div>
          <div>
            <dt>Department</dt>
            <dd>{selected.department ?? 'Not assigned yet'}</dd>
          </div>
          <div>
            <dt>Job title</dt>
            <dd>{selected.designation ?? 'Not assigned yet'}</dd>
          </div>
          <div>
            <dt>Employment status</dt>
            <dd>
              {selected.employment_status === 'ACTIVE'
                ? 'Active'
                : selected.employment_status === 'INACTIVE'
                  ? 'Inactive'
                  : 'Not assigned yet'}
            </dd>
          </div>
        </dl>
      </section>
      {canEdit && !editing && (
        <div className="profile-actions">
          <Button onClick={() => setEditing(true)}>Edit employee details</Button>
        </div>
      )}
      {editing && (
        <>
          <p className="field-hint">Save or cancel editing before closing the employee details.</p>
          <EmployeeEditor employee={selected} onClose={() => setEditing(false)} />
        </>
      )}
    </>
  );
  return (
    <Modal
      title={selected ? selected.first_name + ' ' + selected.last_name : 'Employee profile'}
      subtitle={selected?.employee_code}
      contextLabel="Employee details"
      closeLabel="Close employee details"
      onClose={onClose}
      canClose={(!editing && !salaryEditing) || !selected}
    >
      {selected && error && (
        <p className="profile-refresh-error" role="alert">
          {error} Previously loaded details remain visible and your open draft is preserved. Changes
          are checked again before saving.
        </p>
      )}
      <RequestState
        loading={loading && !selected}
        error={selected ? '' : error}
        loadingMessage="Loading employee details…"
      >
        {selected && (
          <Tabs
            label="Employee information"
            selected={canViewSalary ? tab : 'details'}
            onSelect={setTab}
            tabs={[
              { id: 'details', label: 'Overview', disabled: salaryEditing, content: details },
              ...(canViewSalary
                ? [
                    {
                      id: 'salary',
                      label: 'Salary & history',
                      disabled: editing,
                      content: (
                        <EmployeeSalary
                          key={id}
                          employee={selected}
                          onEditingChange={setSalaryEditing}
                        />
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </RequestState>
    </Modal>
  );
}
