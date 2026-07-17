'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface UserData {
  email: string;
  name: string;
  role: string;
}

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!token) {
      toast.error('Missing invite token.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || 'Failed to activate account.');
        return;
      }

      // Store user data from response for display
      if (result.user) {
        setUserData(result.user);
      }

      setDone(true);
      toast.success(`Account activated! Welcome, ${result.user?.name}. Please log in now.`);
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const roleLabel = userData?.role === 'HR' ? 'HR' : userData?.role === 'MANAGER' ? 'Manager' : userData?.role === 'CEO' ? 'CEO' : 'Employee';
    
    return (
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Account activated</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Your email is verified and your password is set.
          </p>
        </div>

        {userData && (
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-left space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Name:</span> {userData.name}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Email:</span> {userData.email}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Role:</span> <span className="font-bold text-indigo-600 dark:text-indigo-400">{roleLabel}</span>
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Click below to log in and access your {roleLabel.toLowerCase()} dashboard.
          </p>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 mb-4">
          <KeyRound className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Activate your account
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Set a password to verify your email and finish setup.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Activating...</span>
            </>
          ) : (
            <span>Activate Account</span>
          )}
        </button>

        {!token && (
          <p className="text-xs text-rose-500 text-center">
            Missing invite token — please use the link from your invite email.
          </p>
        )}
      </form>
    </div>
  );
}
