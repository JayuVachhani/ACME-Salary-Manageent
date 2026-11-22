import { Button } from '../../shared/ui/button';
import { EmployeeFilters } from './ui/employee-filters';
import { EmployeeResults } from './ui/employee-results';
import { useEmployees } from './use-employees';
import { EmployeeProfile } from './ui/employee-profile';
export function Employees() {
  const model = useEmployees();
  const { selectedId, setSelectedId, refresh, loading } = model;
  return <section className="team-panel" aria-labelledby="employees-heading"><h2 id="employees-heading">Employee directory</h2><p>Search employee profiles and current assignments as of today (UTC).</p>
 <EmployeeFilters model={model}/>
 <Button disabled={loading} onClick={refresh}>Refresh employees</Button>
 <EmployeeResults model={model}/>{selectedId&&<EmployeeProfile key={selectedId} id={selectedId} onClose={()=>setSelectedId('')}/>}
 </section>;
}
