import type { ReactNode } from 'react';
import { Button } from './button';
type Props = {
  page: number;
  pageSize: number;
  total: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  label: string;
  previousLabel: string;
  nextLabel: string;
  summary?: ReactNode;
};
export function Pagination({
  page,
  pageSize,
  total,
  disabled,
  onPageChange,
  label,
  previousLabel,
  nextLabel,
  summary,
}: Props) {
  return (
    <nav className="pagination" aria-label={`${label} pagination`}>
      <Button
        variant="secondary"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        {previousLabel}
      </Button>
      <span>{summary ?? `${total} records. Page ${page}.`}</span>
      <Button
        variant="secondary"
        disabled={disabled || page * pageSize >= total}
        onClick={() => onPageChange(page + 1)}
      >
        {nextLabel}
      </Button>
    </nav>
  );
}
export function OffsetPagination({
  offset,
  onOffsetChange,
  ...props
}: Omit<Props, 'page' | 'onPageChange'> & {
  offset: number;
  onOffsetChange: (offset: number) => void;
}) {
  return (
    <Pagination
      {...props}
      page={Math.floor(offset / props.pageSize) + 1}
      onPageChange={(page) => onOffsetChange((page - 1) * props.pageSize)}
    />
  );
}
