import type { ReactNode } from 'react';
export function LoadingState({ message }: { message: string }) {
  return <p role="status">{message}</p>;
}
export function ErrorState({ message }: { message: string }) {
  return message ? (
    <p className="feedback feedback--error" role="alert">
      {message}
    </p>
  ) : null;
}
export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}
export function RequestState({
  loading,
  error,
  loadingMessage,
  children,
}: {
  loading: boolean;
  error: string;
  loadingMessage: string;
  children: ReactNode;
}) {
  return (
    <>
      <ErrorState message={error} />
      {loading && <LoadingState message={loadingMessage} />}
      {!loading && !error && children}
    </>
  );
}
