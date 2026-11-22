import { ActionFeedback } from '../../shared/ui/action-feedback';
import { FxHistory } from './ui/fx-history';
import { FxEditor } from './ui/fx-editor';
import { FxLookup } from './ui/fx-lookup';
import { useFxRates } from './use-fx-rates';
import { ConfirmationDialog } from '../../shared/ui/confirmation-dialog';
export function FxRates({isHrManager}: {isHrManager: boolean}) {
  const model = useFxRates(isHrManager);
  const { busy, feedback, pending, cancelConfirmation, confirmChange } = model;
  return <section className="team-panel" aria-labelledby="fx-heading"><h2 id="fx-heading">Exchange rates</h2>
    <p>Rates are effective-dated and corrections append history. A rate means one unit of the base currency equals the entered amount of the quote currency.</p>
    <ActionFeedback feedback={feedback} />
    <FxHistory model={model}/>{isHrManager&&<FxEditor model={model}/>}<FxLookup model={model}/><ConfirmationDialog open={Boolean(pending)} busy={busy} title="Confirm FX revision" headingId="fx-confirm-heading" onCancel={cancelConfirmation} onConfirm={confirmChange} confirmLabel="Confirm FX change" busyLabel="Saving FX…" cancelLabel="Cancel FX change"><p>Append revision {pending?pending.expectedRevision+1:''}: 1 {pending?.input.base} = {pending?.input.rate} {pending?.input.quote}, effective {pending?.input.effectiveDate}. Current revision {pending?.expectedRevision}. Source: {pending?.input.source}. Reason: {pending?.input.reason}. Previous history is retained.</p></ConfirmationDialog>
  </section>;
}
