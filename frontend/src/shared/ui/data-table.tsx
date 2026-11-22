import type { ReactNode } from 'react';
type Props = { caption: string; label?: string; head: ReactNode; children: ReactNode };
export function DataTable({
  caption,
  label = `Scrollable ${caption.toLowerCase()}`,
  head,
  children,
}: Props) {
  return (
    <div className="team-table" tabIndex={0} role="region" aria-label={label}>
      <table>
        <caption>{caption}</caption>
        <thead>{head}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
