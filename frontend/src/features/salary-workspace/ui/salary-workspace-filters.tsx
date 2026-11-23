import { Button } from '../../../shared/ui/button';
import { Form, Select, TextInput } from '../../../shared/ui/form-controls';
import type { SalaryWorkspaceModel } from '../use-salary-workspace';

export function SalaryWorkspaceFilters({ model }: { model: SalaryWorkspaceModel }) {
  const { draft, change, filters, loading } = model;
  return (
    <Form className="salary-workspace-filter-form" onSubmit={model.apply}>
      <div className="salary-workspace-filter-grid">
        <TextInput
          label="Find an employee"
          type="search"
          placeholder="Name, employee code or email"
          maxLength={200}
          value={draft.search}
          onChange={(event) => change('search', event.target.value)}
        />
        <Select
          label="Country / region"
          value={draft.country}
          onChange={(event) => change('country', event.target.value)}
        >
          <option value="">All countries / regions</option>
          {filters.countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
              {country.is_active ? '' : ' (inactive)'}
            </option>
          ))}
        </Select>
        <Select
          label="Department"
          value={draft.department}
          onChange={(event) => change('department', event.target.value)}
        >
          <option value="">All departments</option>
          {filters.departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
              {department.is_active ? '' : ' (inactive)'}
            </option>
          ))}
        </Select>
      </div>
      <details className="salary-workspace-more-filters">
        <summary>More filters and display options</summary>
        <div className="form-grid">
          <Select
            label="Employment status"
            value={draft.status}
            onChange={(event) => change('status', event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Select
            label="Sort salary list by"
            value={draft.sort}
            onChange={(event) => change('sort', event.target.value)}
          >
            <option value="code">Employee code</option>
            <option value="name">Employee name</option>
            <option value="joiningDate">Joining date</option>
            <option value="department">Department</option>
            <option value="country">Country / region</option>
          </Select>
          <Select
            label="Sort order"
            value={draft.direction}
            onChange={(event) => change('direction', event.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </Select>
          <Select
            label="Employees per page"
            value={draft.pageSize}
            onChange={(event) => change('pageSize', event.target.value)}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </div>
      </details>
      <div className="form-actions">
        <Button type="submit" disabled={loading}>
          Apply filters
        </Button>
        <Button variant="secondary" disabled={loading} onClick={model.clear}>
          Clear filters
        </Button>
      </div>
    </Form>
  );
}
