import { useAppDispatch, useAppSelector } from '../state/hooks';
import { dismiss } from '../state/notifications';
import { Button } from './button';
import type { Notice } from '../state/notifications';
function NoticeItem({ item, onDismiss }: { item: Notice; onDismiss: () => void }) {
  return (
    <li className={`notification notification--${item.tone}`}>
      <span>{item.message}</span>
      <Button
        variant="secondary"
        onClick={onDismiss}
        aria-label={`Dismiss ${item.tone} notification`}
      >
        Dismiss
      </Button>
    </li>
  );
}
export function Notifications() {
  const items = useAppSelector((state) => state.notifications.items);
  const dispatch = useAppDispatch();
  const renderNotice = (item: Notice) => (
    <NoticeItem key={item.id} item={item} onDismiss={() => dispatch(dismiss(item.id))} />
  );
  return (
    <aside className="notifications" aria-label="Notifications">
      <ol aria-live="assertive" aria-relevant="additions" aria-atomic="false">
        {items.filter((item) => item.tone === 'error').map(renderNotice)}
      </ol>
      <ol aria-live="polite" aria-relevant="additions" aria-atomic="false">
        {items.filter((item) => item.tone !== 'error').map(renderNotice)}
      </ol>
    </aside>
  );
}
