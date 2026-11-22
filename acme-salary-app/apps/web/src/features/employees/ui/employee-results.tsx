import type { EmployeesModel } from '../use-employees';
export function EmployeeResults({ model }: { model: EmployeesModel }) {
  const { query, setQuery, setSelectedId, items, total, loading, error } = model;
  return <>{loading?<p role="status">Loading employees…</p>:!error&&<><p>{total} {total===1?'employee':'employees'}. Page {query.page}.</p>{!items.length?<p>No employees match these filters.</p>:<div className="team-table" tabIndex={0} role="region" aria-label="Scrollable employee directory"><table><caption>Employee results</caption><thead><tr><th>Code / name</th><th>Email</th><th>Assignment</th><th>Joining date</th><th>Actions</th></tr></thead><tbody>{items.map(row=><tr key={row.id}><td>{row.employee_code}<br/>{row.first_name} {row.last_name}</td><td>{row.email}</td><td>{row.country_name??'Unassigned'}<br/>{row.department??'Unassigned'}<br/>{row.employment_status??'Unassigned'}</td><td>{row.joining_date}</td><td><button aria-label={`View profile for employee ${row.employee_code}`} onClick={()=>setSelectedId(row.id)}>View profile</button></td></tr>)}</tbody></table></div>}
 <button disabled={query.page===1} onClick={()=>setQuery({...query,page:query.page-1})}>Previous employee page</button><button disabled={query.page*Number(query.pageSize)>=total} onClick={()=>setQuery({...query,page:query.page+1})}>Next employee page</button></>}
 </>;
}
