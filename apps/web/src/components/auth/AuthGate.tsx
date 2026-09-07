'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
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

    if (signUp && !organizationName.trim()) {
      setError('Organization name is required.');
      return;
    }

    const result = signUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
              organization_name: organizationName.trim(),
            },
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) setError(result.error.message);
    else if (signUp && !result.data.session) setMessage('Check your email to confirm your account, then sign in.');
  }

  function toggleMode() {
    setSignUp(!signUp);
    setError('');
    setMessage('');
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05070b] text-white">
        <span className="text-sm text-white/50">Loading AssetFlow…</span>
      </div>
    );
  }

  if (session) return <>{children}</>;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(139,92,246,0.12),transparent_32%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-16 pt-16 sm:px-8 sm:pt-20 lg:px-12 lg:pt-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/80 sm:text-base">AssetFlow AI</p>
          <h1 className="mt-12 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:mt-14 sm:text-6xl lg:text-7xl">
            Institutional asset intelligence
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-8 text-white/75 sm:text-2xl sm:leading-9">
            {signUp ? 'Create your workspace to manage private-credit assets and documents.' : 'Sign in to manage private-credit assets and documents.'}
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 w-full max-w-[430px] sm:mt-12">
          <div className="space-y-3">
            {signUp && (
              <>
                <label className="sr-only" htmlFor="organization">Organization name</label>
                <input
                  id="organization"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  type="text"
                  required
                  autoComplete="organization"
                  placeholder="Organization name"
                  className="h-12 w-full rounded-lg border border-white/15 bg-white/[0.07] px-4 text-base text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/70 focus:bg-white/[0.09] focus:ring-2 focus:ring-cyan-300/10"
                />
              </>
            )}
            <label className="sr-only" htmlFor="email">Work email</label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
              placeholder="Work email"
              className="h-12 w-full rounded-lg border border-white/15 bg-white/[0.07] px-4 text-base text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/70 focus:bg-white/[0.09] focus:ring-2 focus:ring-cyan-300/10"
            />
            <label className="sr-only" htmlFor="password">Password</label>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
              autoComplete={signUp ? 'new-password' : 'current-password'}
              placeholder="Password"
              className="h-12 w-full rounded-lg border border-white/15 bg-white/[0.07] px-4 text-base text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/70 focus:bg-white/[0.09] focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>

          {error && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          {message && <p className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="h-12 rounded-lg bg-white px-6 font-semibold text-[#05070b] transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
            >
              {signUp ? 'Create workspace' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={toggleMode}
              className="h-12 rounded-lg border border-white/10 bg-white/[0.04] px-5 text-left text-sm text-white/65 transition hover:bg-white/[0.08] hover:text-white"
            >
              {signUp ? 'Already have an account? Sign in' : 'Need an account? Create one'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
