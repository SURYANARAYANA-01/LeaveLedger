'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { loginSchema, LoginInput } from '@/lib/validators/user';
import { toast } from 'sonner';
import { KeyRound, Mail, Lock, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginClient() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
  const error = searchParams.get('error');
  if (!error) return;

  const id = requestAnimationFrame(() => {
    switch (error) {
      case 'NoAccount':
      case 'AccessDenied':
        toast.error(
          'No account was found for this Google email. Please register your company or ask your HR to create an account.'

        );
        break;

      case 'SessionExpired':
        toast.error(
          'Your session has expired or your account is no longer active. Please sign in again.'
        );
        break;

      case 'CredentialsSignin':
        toast.error('Invalid email or password. Please try again.');
        break;

      default:
        toast.error('Sign-in failed. Please try again.');
        break;
    }

    // Remove ?error=... from the URL without reloading the page
    window.history.replaceState({}, '', '/login');
  });

  return () => cancelAnimationFrame(id);
}, [searchParams]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password. Please try again.');
      } else {
        toast.success('Logged in successfully!');
        // Hard navigation (not router.push) is intentional here: it
        // guarantees the browser attaches the just-set session cookie to
        // the next request. A client-side push can race ahead of the
        // cookie actually being applied, briefly serving the previous
        // session's data (e.g. switching accounts in the same browser).
        // eslint-disable-next-line react-hooks/immutability -- window.location is a browser DOM API, not React state
        window.location.href = '/dashboard';
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (email: string) => {
    setValue('email', email);
    setValue('password', 'demo1234');
    toast.success('Credentials filled! Click Login.');
  };

  return (
    <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Sparkles className="w-8 h-8 text-indigo-400" />
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 mb-4">
          <KeyRound className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-slate-700 to-indigo-600 dark:from-indigo-200 dark:via-slate-100 dark:to-indigo-200 bg-clip-text text-transparent">
          LeaveLedger
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Enterprise Leave Management System
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              {...register('email')}
              placeholder="name@company.com"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        <span className="text-xs text-slate-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </div>

      <button
        type="button"
        onClick={() => signIn('google-login', { callbackUrl: '/dashboard' })}
        className="w-full py-3 flex items-center justify-center gap-3 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Register your company
        </Link>
      </p>

      {/* Demo credentials quick fill */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-3">
          Quick demo logins
        </p>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => fillCredentials('demo@leaveledger.com')}
            className="px-2 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer"
          >
            Employee
          </button>
          <button
            onClick={() => fillCredentials('manager@leaveledger.com')}
            className="px-2 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer"
          >
            Manager
          </button>
          <button
            onClick={() => fillCredentials('HR@leaveledger.com')}
            className="px-2 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer"
          >
            HR
          </button>
          <button
            onClick={() => fillCredentials('ceo@leaveledger.com')}
            className="px-2 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer"
          >
            CEO
          </button>
        </div>
      </div>
    </div>
  );
}