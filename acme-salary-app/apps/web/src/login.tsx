import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Team } from './team';
import { OrganizationReferences } from './organization-references';
import { CountryCurrency } from './country-currency';
import { FxRates } from './fx-rates';

export function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallenge] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [identity,setIdentity]=useState<{id:string;isHrManager:boolean;permissions:string[]}|null>(null);
  useEffect(()=>{
    const controller=new AbortController();
    if(signedIn) fetch('/api/v1/auth/me',{signal:controller.signal}).then(async response=>{if(response.ok)setIdentity(await response.json());else{setIdentity(null);setSignedIn(false);}}).catch(()=>{});
    else setIdentity(null);
    return()=>controller.abort();
  },[signedIn]);
  useEffect(() => {
    const controller = new AbortController();
    if (document.cookie.split('; ').some(value => value.startsWith('acme_csrf='))) {
      fetch('/api/v1/auth/me', { signal: controller.signal }).then(response => setSignedIn(response.ok)).catch(() => {});
    }
    return () => controller.abort();
  }, []);
  async function request(path: string, body: object) {
    const response = await fetch(`/api/v1/auth/${path}`, { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': document.cookie.split('; ').find(v => v.startsWith('acme_csrf='))?.slice(10) ?? '' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok) throw new Error(typeof result.message === 'string' ? result.message : 'Request failed. Please try again.');
    return result;
  }
  async function send() {
    const result = await request(challengeId ? 'otp/resend' : 'otp/request', { email });
    setChallenge(result.challengeId); setCode(''); setMessage(result.message);
  }
  async function act(work: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await work(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Service unavailable. Please try again.'); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    void act(async () => {
      if (!challengeId) await send();
      else { await request('otp/verify', { challengeId, code }); setSignedIn(true); setMessage('Signed in. Business modules are still being developed.'); }
    });
  }
  return <><section className="login-panel" aria-labelledby="sign-in"><h2 id="sign-in">{signedIn ? 'Signed in to ACME' : 'Sign in to ACME'}</h2>
    <p>Invite-only access. Use your registered work email.</p>
    {signedIn ? <button disabled={busy} onClick={() => void act(async () => {
      await request('logout', {}); setSignedIn(false); setChallenge(''); setCode(''); setMessage('Signed out.');
    })}>Sign out</button> : <form onSubmit={submit}>
      <label htmlFor="login-email">Work email</label>
      <input id="login-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy || Boolean(challengeId)} onChange={e => setEmail(e.target.value)} />
      {challengeId && <><label htmlFor="login-code">One-time code</label><input id="login-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={code} onChange={e => setCode(e.target.value)} /><p>Enter the six-digit code from your email.</p></>}
      <button type="submit" disabled={busy}>{busy ? 'Please wait…' : challengeId ? 'Verify code' : 'Send sign-in code'}</button>
      {challengeId && <><button type="button" disabled={busy} onClick={() => void act(send)}>Resend code</button><button type="button" disabled={busy} onClick={() => { setChallenge(''); setCode(''); setMessage(''); }}>Use another email</button></>}
    </form>}
    {message && <p role="alert">{message}</p>}
  </section>{signedIn&&identity?.isHrManager&&<><Team userId={identity.id} onSelfRemoved={()=>{setSignedIn(false);setIdentity(null);setChallenge('');setCode('');setMessage('Your access was removed.');}}/><OrganizationReferences/></>}{signedIn&&identity&&(identity.isHrManager||identity.permissions.includes('read'))&&<><CountryCurrency isHrManager={identity.isHrManager}/><FxRates isHrManager={identity.isHrManager}/></>}</>;
}
