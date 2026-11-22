import { Button } from '../../../shared/ui/button';
import { Form, Select, TextInput } from '../../../shared/ui/form-controls';
import type { EmployeesModel } from '../use-employees';
export function EmployeeFilters({ model }: { model: EmployeesModel }) {
  const { draft, setDraft, applyFilters, clearFilters, filters, loading } = model;
  return (
    <>
      <Form onSubmit={applyFilters}>
        <TextInput
          label="Search employees"
          id="employee-search"
          maxLength={200}
          value={draft.search}
          onChange={(e) => setDraft({ ...draft, search: e.target.value })}
          placeholder="Code, name or email"
        />
        <Select
          label="Employee country"
          id="employee-country"
          value={draft.country}
          onChange={(e) => setDraft({ ...draft, country: e.target.value })}
        >
          <option value="">All countries</option>
          {filters.countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
              {c.is_active ? '' : ' (inactive reference)'}
            </option>
          ))}
        </Select>
        <Select
          label="Employee department"
          id="employee-department"
          value={draft.department}
          onChange={(e) => setDraft({ ...draft, department: e.target.value })}
        >
          <option value="">All departments</option>
          {filters.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.is_active ? '' : ' (inactive reference)'}
            </option>
          ))}
        </Select>
        <Select
          label="Employment status"
          id="employee-status"
          value={draft.status}
          onChange={(e) => setDraft({ ...draft, status: e.target.value })}
        >
          <option value="">All statuses</option>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
        </Select>
        <Select
          label="Sort employees by"
          id="employee-sort"
          value={draft.sort}
          onChange={(e) => setDraft({ ...draft, sort: e.target.value })}
        >
          <option value="code">Code</option>
          <option value="name">Name</option>
          <option value="joiningDate">Joining date</option>
          <option value="department">Department</option>
          <option value="country">Country</option>
        </Select>
        <Select
          label="Employee sort direction"
          id="employee-direction"
          value={draft.direction}
          onChange={(e) => setDraft({ ...draft, direction: e.target.value })}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </Select>
        <Select
          label="Employees per page"
          id="employee-page-size"
          value={draft.pageSize}
          onChange={(e) => setDraft({ ...draft, pageSize: e.target.value })}
        >
          <option>25</option>
          <option>50</option>
          <option>100</option>
        </Select>
        <Button type="submit" disabled={loading}>
          Apply employee filters
        </Button>
        <Button type="button" disabled={loading} onClick={clearFilters}>
          Clear employee filters
        </Button>
      </Form>
    </>
  );
}
