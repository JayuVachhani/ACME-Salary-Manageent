import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAction } from '../../shared/hooks/use-action';
import { authApi } from './api';
import { useSession } from './session-context';
export function useLogin() {
  const session = useSession(); const action = useAction();
  const [email, setEmail] = useState(''), [code, setCode] = useState(''), [challengeId, setChallenge] = useState('');
  const signedIn = session.identity !== null;
  async function send(signal: AbortSignal) {
    const result = await authApi.request(email, Boolean(challengeId), signal);
    if (signal.aborted) return;
    setChallenge(result.challengeId); setCode(''); action.setMessage(result.message);
  }
  function act(work: (signal: AbortSignal) => Promise<void>) { session.clearNotice(); return action.perform(work); }
  function submit(event: FormEvent) {
    event.preventDefault();
    void act(async signal => {
      if (!challengeId) return send(signal);
      await authApi.verify(challengeId, code, signal);
      if (signal.aborted) return;
      const identity = await session.refresh();
      if (!identity) throw new Error('Sign in required');
      setChallenge(''); setCode(''); action.setMessage('Signed in. Business modules are still being developed.');
    });
  }
  function logout() { void act(async signal => {
    await authApi.logout(signal); if (signal.aborted) return;
    setChallenge(''); setCode(''); session.clear('Signed out.');
  }); }
  function anotherEmail() { setChallenge(''); setCode(''); action.setMessage(''); session.clearNotice(); }
  return { email, setEmail, code, setCode, challengeId, signedIn, busy: action.busy,
    message: session.notice || action.message || session.error, submit, logout, resend: () => void act(send), anotherEmail };
}
