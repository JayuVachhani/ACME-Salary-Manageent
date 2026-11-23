type RecordedSalaryStatus = {
  approvalStatus: 'ACTIVE' | 'WAITING_MANAGEMENT_APPROVAL';
  effectiveFrom: string;
  isSuperseded?: boolean;
};

/** One display contract for recorded, scheduled and superseded ledger entries. */
export function formatSalaryStatus(entry: RecordedSalaryStatus, businessDate: string): string {
  if (entry.isSuperseded) return 'Corrected · original preserved';
  const state =
    entry.approvalStatus === 'WAITING_MANAGEMENT_APPROVAL'
      ? 'Recorded · management review pending'
      : 'Recorded';
  return entry.effectiveFrom > businessDate ? 'Scheduled · ' + state : state;
}
