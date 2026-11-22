import { ErrorState } from '../../shared/ui/request-state';
import { ActionFeedback } from '../../shared/ui/action-feedback';
import { Button } from '../../shared/ui/button';
import { Form, TextInput } from '../../shared/ui/form-controls';
import { useLogin } from './use-login';
export function Login() {
  const { email, setEmail, code, setCode, challengeId, signedIn, busy, feedback, error, submit, logout, resend, anotherEmail } = useLogin();
  return <><section className="login-panel" aria-labelledby="sign-in"><h2 id="sign-in">{signedIn ? 'Signed in to ACME' : 'Sign in to ACME'}</h2>
    <p>Invite-only access. Use your registered work email.</p>
    {signedIn ? <Button disabled={busy} onClick={logout}>Sign out</Button> : <Form onSubmit={submit}>
      <TextInput label="Work email" id="login-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy || Boolean(challengeId)} onChange={e => setEmail(e.target.value)} />
      {challengeId && <><TextInput label="One-time code" hint="Enter the six-digit code from your email." id="login-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={busy} value={code} onChange={e => setCode(e.target.value)} /></>}
      <Button type="submit" disabled={busy}>{busy ? 'Please wait…' : challengeId ? 'Verify code' : 'Send sign-in code'}</Button>
      {challengeId && <><Button type="button" disabled={busy} onClick={resend}>Resend code</Button><Button type="button" disabled={busy} onClick={anotherEmail}>Use another email</Button></>}
    </Form>}
    <ErrorState message={error} /><ActionFeedback feedback={feedback} />
  </section></>;
}
