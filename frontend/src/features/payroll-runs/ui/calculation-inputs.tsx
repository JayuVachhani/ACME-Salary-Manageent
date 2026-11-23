import { Select, TextInput, Textarea } from '../../../shared/ui/form-controls';
import type { CalculationFields } from '../types';
export function CalculationInputs({
  fields,
  onChange,
}: {
  fields: CalculationFields;
  onChange: (key: keyof CalculationFields, value: string) => void;
}) {
  return (
    <div className="form-grid">
      <Select
        label="PF eligible?"
        value={fields.pfEligible}
        onChange={(e) => onChange('pfEligible', e.target.value)}
      >
        <option value="">Choose eligibility</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </Select>
      <Select
        label="ESI eligible?"
        value={fields.esiEligible}
        onChange={(e) => onChange('esiEligible', e.target.value)}
      >
        <option value="">Choose eligibility</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </Select>
      <TextInput
        label="State code"
        value={fields.stateCode}
        onChange={(e) => onChange('stateCode', e.target.value)}
        hint="Use the state code configured in the approved policy."
      />
      <TextInput
        label="Manual professional tax (INR)"
        inputMode="decimal"
        value={fields.ptAmount}
        onChange={(e) => onChange('ptAmount', e.target.value)}
        hint="Explicit amount; enter 0 when the policy calculates tax or disables it."
      />
      <TextInput
        label="TDS (INR)"
        inputMode="decimal"
        value={fields.tdsAmount}
        onChange={(e) => onChange('tdsAmount', e.target.value)}
      />
      <TextInput
        label="Leaving date, if applicable"
        type="date"
        value={fields.leavingDate}
        onChange={(e) => onChange('leavingDate', e.target.value)}
      />
      <Textarea
        label="Unpaid dates, if any"
        value={fields.unpaidDates}
        onChange={(e) => onChange('unpaidDates', e.target.value)}
        hint="One YYYY-MM-DD date per line. Leave blank only when there are no unpaid dates."
      />
    </div>
  );
}
