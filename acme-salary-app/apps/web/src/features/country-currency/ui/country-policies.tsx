import type { CountryCurrencyModel } from '../use-country-currency';
import { CountryEditor } from './country-editor';
export function CountryPolicies({ model }: { model: CountryCurrencyModel }) {
  const { countries, total, offset, setOffset, editing, busy, edit } = model;
  return <><h3>Country policies</h3><p>Regulatory and retention notes are descriptive. Active retention holds remain enforced separately. Country codes are immutable two-letter organization identifiers; no complete ISO country catalogue is claimed.</p>
        <div className="team-table"><table><caption>Country policies</caption><thead><tr><th>Country</th><th>Policy</th><th>Status</th><th>Actions</th></tr></thead><tbody>{countries.map(country=><tr key={country.country_code}>
          <td>{country.country_name} ({country.country_code})</td><td>{country.default_currency}; {country.decimal_places} decimals; {country.rounding_mode}</td><td>{country.is_active?'Active':'Inactive'}</td>
          <td><button disabled={busy} aria-label={`Edit country ${country.country_code}`} onClick={()=>edit(country)}>Edit</button></td></tr>)}</tbody></table></div>
        {!countries.length&&<p>No country policies yet.</p>}<p>{total} countries. Page {Math.floor(offset/20)+1}.</p>
        <button disabled={busy||offset===0} onClick={()=>{setOffset(offset-20);}}>Previous countries</button>
        <button disabled={busy||offset+20>=total} onClick={()=>{setOffset(offset+20);}}>Next countries</button>
        <h3>{editing?'Edit country policy':'Add country policy'}</h3>
        <CountryEditor model={model}/>
      </>;
}
