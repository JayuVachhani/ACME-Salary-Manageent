import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAction } from '../../shared/hooks/use-action';
import { authApi, useLogoutMutation } from './api';
import { runRequest } from '../../shared/api/run-request';
import { useSession } from './use-session';
export function useLogin() {
  const session = useSession(); const action = useAction();
  const [signOut] = useLogoutMutation();
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
      setChallenge(''); setCode('');
      const identity = await session.refresh();
      if (!identity) throw new Error('Sign in required');
      action.announce('Signed in.');
    });
  }
  function logout() { void act(async signal => {
    await runRequest(signOut(), signal); if (signal.aborted) return;
    setChallenge(''); setCode(''); session.clear('Signed out.');
  }); }
  function anotherEmail() { setChallenge(''); setCode(''); action.setMessage(''); session.clearNotice(); }
  return { email, setEmail, code, setCode, challengeId, signedIn, busy: action.busy,
    feedback: action.feedback, error: session.error, submit, logout, resend: () => void act(send), anotherEmail };
}
