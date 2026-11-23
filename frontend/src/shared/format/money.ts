/** Format decimal text without converting money to floating-point numbers or rounding it. */
export function decimalInput(amount: string, decimalPlaces: number): string {
  if (
    !/^\d+(?:\.\d+)?$/.test(amount) ||
    !Number.isInteger(decimalPlaces) ||
    decimalPlaces < 0 ||
    decimalPlaces > 4
  )
    return amount;
  const [whole, fraction = ''] = amount.split('.');
  // Preserve unexpected nonzero precision rather than silently changing a financial value.
  if (/[^0]/.test(fraction.slice(decimalPlaces))) return amount;
  return (
    whole + (decimalPlaces ? '.' + fraction.slice(0, decimalPlaces).padEnd(decimalPlaces, '0') : '')
  );
}

export function formatMoney(amount: string, currency: string, decimalPlaces: number): string {
  const value = decimalInput(amount, decimalPlaces);
  const [whole = '', fraction] = value.split('.');
  const grouped = /^\d+$/.test(whole) ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : whole;
  return currency + ' ' + grouped + (fraction === undefined ? '' : '.' + fraction);
}
