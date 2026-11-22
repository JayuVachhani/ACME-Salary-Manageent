import type { Currency } from '../api/currency-catalogue';
import { Select } from './form-controls';
import type { SelectProps } from './form-controls';
type Props = Omit<SelectProps, 'children' | 'value'> & {
  value: string; currencies: readonly Pick<Currency, 'code' | 'currency_name'>[];
  placeholder: string; showNames?: boolean; unavailableLabel?: string;
};
export function CurrencySelect({ value, currencies, placeholder, showNames = false, unavailableLabel = 'inactive/unavailable', ...props }: Props) {
  return <Select {...props} value={value}><option value="">{placeholder}</option>
    {value && !currencies.some(currency => currency.code === value) && <option value={value} disabled>{value} — {unavailableLabel}</option>}
    {currencies.map(currency => <option key={currency.code} value={currency.code}>{currency.code}{showNames ? ` — ${currency.currency_name}` : ''}</option>)}
  </Select>;
}
