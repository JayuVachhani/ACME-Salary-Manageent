import { OffsetPagination } from '../../../shared/ui/pagination';
import { EmptyState } from '../../../shared/ui/request-state';
import { DataTable } from '../../../shared/ui/data-table';
import { Button } from '../../../shared/ui/button';
import type { CountryCurrencyModel } from '../use-country-currency';
import { CountryEditor } from './country-editor';
export function CountryPolicies({ model }: { model: CountryCurrencyModel }) {
  const { countries, total, offset, setOffset, editing, busy, edit } = model;
  return (
    <>
      <h3>Country policies</h3>
      <p>
        Regulatory and retention notes are descriptive. Active retention holds remain enforced
        separately. Country codes are immutable two-letter organization identifiers; no complete ISO
        country catalogue is claimed.
      </p>
      <DataTable
        caption="Country policies"
        head={
          <tr>
            <th>Country</th>
            <th>Policy</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        }
      >
        {countries.map((country) => (
          <tr key={country.country_code}>
            <td>
              {country.country_name} ({country.country_code})
            </td>
            <td>
              {country.default_currency}; {country.decimal_places} decimals; {country.rounding_mode}
            </td>
            <td>{country.is_active ? 'Active' : 'Inactive'}</td>
            <td>
              <Button
                disabled={busy}
                aria-label={`Edit country ${country.country_code}`}
                onClick={() => edit(country)}
              >
                Edit
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
      {!countries.length && <EmptyState>No country policies yet.</EmptyState>}
      <OffsetPagination
        label="Countries"
        offset={offset}
        pageSize={20}
        total={total}
        disabled={busy}
        onOffsetChange={setOffset}
        previousLabel="Previous countries"
        nextLabel="Next countries"
        summary={`${total} countries. Page ${Math.floor(offset / 20) + 1}.`}
      />
      <h3>{editing ? 'Edit country policy' : 'Add country policy'}</h3>
      <CountryEditor model={model} />
    </>
  );
}
