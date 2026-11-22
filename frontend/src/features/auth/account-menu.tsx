import { useLogin } from './use-login';
import { Button } from '../../shared/ui/button';
import { ActionFeedback } from '../../shared/ui/action-feedback';
export function AccountMenu() {
  const { busy, logout, feedback } = useLogin();
  return (
    <div className="account-menu">
      <Button variant="secondary" disabled={busy} onClick={logout}>
        {busy ? 'Signing out…' : 'Sign out'}
      </Button>
      <ActionFeedback feedback={feedback} />
    </div>
  );
}
