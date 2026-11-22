import { RequestState } from '../../../shared/ui/request-state';
import { Button } from '../../../shared/ui/button';
import { useEmployeeProfile } from '../use-employee-profile';
export function EmployeeProfile({id,onClose}: {id:string;onClose:()=>void}) {
 const { data: selected, loading: detailLoading, error: detailError } = useEmployeeProfile(id);
 return <section aria-labelledby="employee-profile-heading"><h3 id="employee-profile-heading">Employee profile</h3><Button onClick={onClose}>Close employee profile</Button><RequestState loading={detailLoading} error={detailError} loadingMessage="Loading employee profile…">{selected&&<dl style={{overflowWrap:'anywhere'}}><dt>Employee code</dt><dd>{selected.employee_code}</dd><dt>Name</dt><dd>{selected.first_name} {selected.last_name}</dd><dt>Email</dt><dd>{selected.email}</dd><dt>Joining date</dt><dd>{selected.joining_date}</dd><dt>Country</dt><dd>{selected.country_name??'Unassigned'}</dd><dt>Department</dt><dd>{selected.department??'Unassigned'}</dd><dt>Designation</dt><dd>{selected.designation??'Unassigned'}</dd><dt>Status</dt><dd>{selected.employment_status??'Unassigned'}</dd></dl>}</RequestState></section>;
}
