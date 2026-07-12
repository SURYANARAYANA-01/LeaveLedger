'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { loginSchema, LoginInput } from '@/lib/validators/user';
import { toast } from 'sonner';
import { KeyRound, Mail, Lock, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
        toast.error('Invalid credentials. Please try again.');
      } else {
        toast.success('Logged in successfully!');
        router.push('/dashboard');
        router.refresh();
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
    <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Sparkles className="w-8 h-8 text-indigo-400" />
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 mb-4">
          <KeyRound className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-slate-100 to-indigo-200 bg-clip-text text-transparent">
          LeaveLedger
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Enterprise Leave Management System
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              {...register('email')}
              placeholder="name@company.com"
              className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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

      {/* Demo credentials quick fill */}
      <div className="mt-8 pt-6 border-t border-slate-800/80">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Quick demo logins
        </p>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => fillCredentials('demo@leaveledger.com')}
            className="px-2 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-[11px] font-medium text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer"
          >
            Employee
          </button>
          <button
            onClick={() => fillCredentials('manager@leaveledger.com')}
            className="px-2 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-[11px] font-medium text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer"
          >
            Manager
          </button>
          <button
            onClick={() => fillCredentials('admin@leaveledger.com')}
            className="px-2 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-[11px] font-medium text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer"
          >
            HR Admin
          </button>
          <button
            onClick={() => fillCredentials('ceo@leaveledger.com')}
            className="px-2 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-[11px] font-medium text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer"
          >
            CEO
          </button>
        </div>
      </div>
    </div>
  );
}
