import type { EmployeesModel } from '../use-employees';
export function EmployeeFilters({ model }: { model: EmployeesModel }) {
  const { draft, setDraft, applyFilters, clearFilters, filters, loading } = model;
  return <><form onSubmit={applyFilters}>
 <label htmlFor="employee-search">Search employees</label><input id="employee-search" maxLength={200} value={draft.search} onChange={e=>setDraft({...draft,search:e.target.value})} placeholder="Code, name or email"/>
 <label htmlFor="employee-country">Employee country</label><select id="employee-country" value={draft.country} onChange={e=>setDraft({...draft,country:e.target.value})}><option value="">All countries</option>{filters.countries.map(c=><option key={c.code} value={c.code}>{c.name}{c.is_active?'':' (inactive reference)'}</option>)}</select>
 <label htmlFor="employee-department">Employee department</label><select id="employee-department" value={draft.department} onChange={e=>setDraft({...draft,department:e.target.value})}><option value="">All departments</option>{filters.departments.map(d=><option key={d.id} value={d.id}>{d.name}{d.is_active?'':' (inactive reference)'}</option>)}</select>
 <label htmlFor="employee-status">Employment status</label><select id="employee-status" value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option></select>
 <label htmlFor="employee-sort">Sort employees by</label><select id="employee-sort" value={draft.sort} onChange={e=>setDraft({...draft,sort:e.target.value})}><option value="code">Code</option><option value="name">Name</option><option value="joiningDate">Joining date</option><option value="department">Department</option><option value="country">Country</option></select>
 <label htmlFor="employee-direction">Employee sort direction</label><select id="employee-direction" value={draft.direction} onChange={e=>setDraft({...draft,direction:e.target.value})}><option value="asc">Ascending</option><option value="desc">Descending</option></select>
 <label htmlFor="employee-page-size">Employees per page</label><select id="employee-page-size" value={draft.pageSize} onChange={e=>setDraft({...draft,pageSize:e.target.value})}><option>25</option><option>50</option><option>100</option></select>
 <button type="submit" disabled={loading}>Apply employee filters</button><button type="button" disabled={loading} onClick={clearFilters}>Clear employee filters</button></form></>;
}
