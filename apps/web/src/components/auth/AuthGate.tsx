'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUp, setSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    const result = signUp
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: email.split('@')[0], organization_name: 'My Organization' } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setError(result.error.message);
    else if (signUp && !result.data.session) setMessage('Check your email to confirm your account, then sign in.');
  }

  if (loading) return <div className="min-h-screen grid place-items-center bg-gray-950 text-white">Loading AssetFlow…</div>;
  if (session) return <>{children}</>;

  return (
    <main className="min-h-screen bg-gray-950 text-white grid place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-widest text-cyan-400">ASSETFLOW AI</p>
          <h1 className="mt-3 text-3xl font-semibold">Institutional asset intelligence</h1>
          <p className="mt-2 text-sm text-gray-400">Sign in to manage private-credit assets and documents.</p>
        </div>
        <div className="space-y-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Work email" className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-cyan-400" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder="Password" className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-cyan-400" />
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {message && <p className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p>}
        <button className="mt-6 w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300">{signUp ? 'Create account' : 'Sign in'}</button>
        <button type="button" onClick={() => setSignUp(!signUp)} className="mt-4 w-full text-sm text-gray-400 hover:text-white">{signUp ? 'Already have an account? Sign in' : 'Need an account? Create one'}</button>
      </form>
    </main>
  );
}
