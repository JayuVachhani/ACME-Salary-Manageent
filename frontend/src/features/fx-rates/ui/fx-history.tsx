import { OffsetPagination } from '../../../shared/ui/pagination';
import { RequestState, EmptyState } from '../../../shared/ui/request-state';
import { DataTable } from '../../../shared/ui/data-table';
import { Button } from '../../../shared/ui/button';
import { Form, TextInput } from '../../../shared/ui/form-controls';
import type { FxRatesModel } from '../use-fx-rates';
export function FxHistory({ model }: { model: FxRatesModel }) {
  const {
    isHrManager,
    items,
    total,
    offset,
    setOffset,
    filter,
    setFilter,
    busy,
    loading,
    error,
    applyFilters,
    refresh,
    prepareCorrection,
  } = model;
  return (
    <>
      <Form onSubmit={applyFilters}>
        <TextInput
          label="Filter base currency"
          id="fx-filter-base"
          maxLength={3}
          pattern="[A-Z]{3}"
          value={filter.base}
          onChange={(e) => setFilter({ ...filter, base: e.target.value.toUpperCase() })}
        />
        <TextInput
          label="Filter quote currency"
          id="fx-filter-quote"
          maxLength={3}
          pattern="[A-Z]{3}"
          value={filter.quote}
          onChange={(e) => setFilter({ ...filter, quote: e.target.value.toUpperCase() })}
        />
        <TextInput
          label="History through date"
          id="fx-filter-date"
          type="date"
          value={filter.asOf}
          onChange={(e) => setFilter({ ...filter, asOf: e.target.value })}
        />
        <Button busy={busy} busyLabel="Saving…" type="submit">
          Apply FX filters
        </Button>
      </Form>
      <Button disabled={busy || loading} onClick={refresh}>
        Refresh FX history
      </Button>
      <RequestState loading={loading} error={error} loadingMessage="Loading exchange rates…">
        <DataTable
          caption="FX revision history"
          label="Scrollable FX history"
          head={
            <tr>
              <th>Pair and date</th>
              <th>Rate / revision</th>
              <th>Provenance</th>
              {isHrManager && <th>Actions</th>}
            </tr>
          }
        >
          {items.map((row) => (
            <tr key={row.id}>
              <td>
                {row.base_currency} → {row.quote_currency}
                <br />
                {row.effective_date}
              </td>
              <td>
                {row.rate}
                <br />
                Revision {row.revision}
              </td>
              <td>
                {row.source}
                <br />
                {row.reason}
                <br />
                User {row.created_by}
                <br />
                {row.recorded_at}
              </td>
              {isHrManager && (
                <td>
                  <Button
                    disabled={busy}
                    aria-label={`Prepare FX revision ${row.id}`}
                    onClick={() => prepareCorrection(row)}
                  >
                    Prepare correction
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </DataTable>
        {!items.length && <EmptyState>No exchange rate revisions match.</EmptyState>}
        <OffsetPagination
          label="FX history"
          offset={offset}
          pageSize={20}
          total={total}
          disabled={busy}
          onOffsetChange={setOffset}
          previousLabel="Previous FX page"
          nextLabel="Next FX page"
          summary={`${total} FX revisions. Page ${Math.floor(offset / 20) + 1}.`}
        />
      </RequestState>
    </>
  );
}
