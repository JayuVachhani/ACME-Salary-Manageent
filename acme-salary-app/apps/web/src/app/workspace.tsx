import { useSession } from '../features/auth';
import { Team } from '../features/team';
import { OrganizationReferences } from '../features/organization-references';
import { CountryCurrency } from '../features/country-currency';
import { Employees } from '../features/employees';
import { FxRates } from '../features/fx-rates';
export function Workspace() {
  const session = useSession(); const identity = session.identity;
  if (!identity) return null;
  return <>{identity.isHrManager && <><Team userId={identity.id} onSelfRemoved={() => session.clear('Your access was removed.')} /><OrganizationReferences /></>}
    {(identity.isHrManager || identity.permissions.includes('read')) && <><Employees /><CountryCurrency isHrManager={identity.isHrManager} /><FxRates isHrManager={identity.isHrManager} /></>}</>;
}
