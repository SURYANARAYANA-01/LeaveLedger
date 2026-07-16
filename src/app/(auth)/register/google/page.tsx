'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Building2, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleRegisterCompletionPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Automatically continue the sign-in once the company is created — the
  // browser still has an active Google session from moments ago, so this
  // redirect is typically silent/instant rather than showing the picker
  // again, avoiding a second manual click.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      signIn('google-login', { callbackUrl: '/dashboard' });
    }, 800);
    return () => clearTimeout(timer);
  }, [done]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Missing or invalid registration link. Please start over from the login page.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, companyName }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || 'Registration failed.');
        return;
      }

      setDone(true);
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Company created</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 mb-6">
          Signing you in as CEO...
        </p>
        <button
          onClick={() => signIn('google-login', { callbackUrl: '/dashboard' })}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Sparkles className="w-8 h-8 text-indigo-400" />
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 mb-4">
          <Building2 className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          One more step
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Your Google account is verified. What&apos;s your company called?
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Company Name
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              minLength={2}
              placeholder="Acme Inc."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating company...</span>
            </>
          ) : (
            <span>Create Company & CEO Account</span>
          )}
        </button>

        {!token && (
          <p className="text-xs text-rose-500 text-center">
            Missing registration token — please go back and try &quot;Continue with Google&quot; again.
          </p>
        )}
      </form>
    </div>
  );
}