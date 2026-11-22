import { CountryPolicies } from './ui/country-policies';
import { CurrencyCatalogue } from './ui/currency-catalogue';
import { useCountryCurrency } from './use-country-currency';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
export function CountryCurrency({isHrManager}: {isHrManager: boolean}) {
  const model = useCountryCurrency(isHrManager);
  const { loading, busy, message, confirmation, cancelConfirmation, confirmChange, refresh } = model;
  return <section className="team-panel" aria-labelledby="country-currency-heading"><h2 id="country-currency-heading">Countries and currencies</h2>
    <p>ISO codes and minor units are read-only. Country policies apply to new salary records; historical snapshots remain unchanged.</p>
    {message&&<p role="alert">{message}</p>}
    <button disabled={busy||loading} onClick={refresh}>Refresh countries and currencies</button>
    {loading?<p role="status">Loading countries and currencies…</p>:<>
      <CurrencyCatalogue model={model}/>{isHrManager&&<CountryPolicies model={model}/>}
    </>}
    <ConfirmationDialog open={Boolean(confirmation)} busy={busy} title="Confirm country or currency change" headingId="country-confirm-heading" onCancel={cancelConfirmation} onConfirm={confirmChange} confirmLabel="Confirm policy change" busyLabel="Saving policy…" cancelLabel="Cancel policy change"><p>{confirmation?.details}</p></ConfirmationDialog>
  </section>;
}
