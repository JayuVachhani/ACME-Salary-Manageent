import { CurrencySelect } from '../../../shared/ui/currency-select';
import { Button } from '../../../shared/ui/button';
import { Form, TextInput, Textarea } from '../../../shared/ui/form-controls';
import type { FxRatesModel } from '../use-fx-rates';
export function FxEditor({ model }: { model: FxRatesModel }) {
  const { draft, setDraft, revision, setRevision, busy, active, loadRevision, writeSubmit } = model;
  return <><h3>Add FX revision</h3><p>Only active currencies are available for new revisions. No existing rate is overwritten or deleted.</p>
      <Form onSubmit={writeSubmit}>
        <CurrencySelect label="Rate base currency" id="fx-base" required disabled={busy} value={draft.base}
          onChange={e=>{setDraft({...draft,base:e.target.value});setRevision(null);}} currencies={active} placeholder="Choose base" unavailableLabel="inactive" />
        <CurrencySelect label="Rate quote currency" id="fx-quote" required disabled={busy} value={draft.quote}
          onChange={e=>{setDraft({...draft,quote:e.target.value});setRevision(null);}} currencies={active} placeholder="Choose quote" unavailableLabel="inactive" />
        <TextInput label="Rate effective date" id="fx-date" required type="date" disabled={busy} value={draft.effectiveDate} onChange={e=>{setDraft({...draft,effectiveDate:e.target.value});setRevision(null);}}/>
        <Button type="button" disabled={busy||!draft.base||!draft.quote||!draft.effectiveDate||draft.base===draft.quote} onClick={loadRevision}>Load current FX revision</Button>
        <TextInput label="FX rate" id="fx-rate" required inputMode="decimal" pattern="(0|[1-9][0-9]{0,9})(\.[0-9]{1,8})?" maxLength={19} disabled={busy} value={draft.rate} onChange={e=>setDraft({...draft,rate:e.target.value})}/>
        <TextInput label="Rate source" id="fx-source" required maxLength={500} disabled={busy} value={draft.source} onChange={e=>setDraft({...draft,source:e.target.value})}/>
        <Textarea label="Revision reason" id="fx-reason" required maxLength={2000} disabled={busy} value={draft.reason} onChange={e=>setDraft({...draft,reason:e.target.value})}/>
        <Button disabled={busy||revision===null} type="submit">Review FX revision</Button>
      </Form></>;
}
