import { useLogin } from './use-login';
export function Login() {
  const { email, setEmail, code, setCode, challengeId, signedIn, busy, message, submit, logout, resend, anotherEmail } = useLogin();
  return <><section className="login-panel" aria-labelledby="sign-in"><h2 id="sign-in">{signedIn ? 'Signed in to ACME' : 'Sign in to ACME'}</h2>
    <p>Invite-only access. Use your registered work email.</p>
    {signedIn ? <button disabled={busy} onClick={logout}>Sign out</button> : <form onSubmit={submit}>
      <label htmlFor="login-email">Work email</label>
      <input id="login-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy || Boolean(challengeId)} onChange={e => setEmail(e.target.value)} />
      {challengeId && <><label htmlFor="login-code">One-time code</label><input id="login-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={code} onChange={e => setCode(e.target.value)} /><p>Enter the six-digit code from your email.</p></>}
      <button type="submit" disabled={busy}>{busy ? 'Please wait…' : challengeId ? 'Verify code' : 'Send sign-in code'}</button>
      {challengeId && <><button type="button" disabled={busy} onClick={resend}>Resend code</button><button type="button" disabled={busy} onClick={anotherEmail}>Use another email</button></>}
    </form>}
    {message && <p role="alert">{message}</p>}
  </section></>;
}
