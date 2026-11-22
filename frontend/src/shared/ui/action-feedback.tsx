import type { LocalFeedback } from '../state/notifications';
export function ActionFeedback({ feedback }: { feedback: LocalFeedback | null }) {
  if (!feedback) return null;
  return (
    <p
      className={`feedback feedback--${feedback.tone}`}
      role={feedback.tone === 'error' ? 'alert' : 'status'}
    >
      {feedback.message}
    </p>
  );
}
