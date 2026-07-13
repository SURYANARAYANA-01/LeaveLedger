'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { Briefcase, Clock } from 'lucide-react';
import { User } from 'lucide-react';

interface DashboardHeaderProps {
  user: {
    name: string;
    role: string;
    department?: { name: string } | null;
    manager?: { name: string } | null;
  };
}

function getRoleTitle(role: string) {
  if (role === 'CEO') return 'CEO';
  if (role === 'ADMIN') return 'HR';
  if (role === 'MANAGER') return 'Manager';
  return 'Team Member';
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState('');
  const [loginTime, setLoginTime] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Format current time as "09:12 AM"
    setLoginTime(
      new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    );
  }, []);

  const firstName = user.name.split(' ')[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden relative">
      {/* Abstract background gradient accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-violet-500/5 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            👋 {greeting}, {firstName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Track your leave requests, view holiday schedules, and manage time-off balances.
          </p>
        </div>

        {/* Metadata items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 pt-5 xl:pt-0 xl:pl-8 flex-1 xl:max-w-3xl">
          {/* Title & Department */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Job Title
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                {getRoleTitle(user.role)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-500 block mt-0.5 truncate">
                {user.department?.name || 'Engineering'} Department
              </span>
            </div>
          </div>

          {/* Reporting Manager */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Reporting Manager
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                {user.manager?.name || '—'}
              </span>
            </div>
          </div>

          {/* Last Login */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Last Login
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                Today
              </span>
              {loginTime && (
                <span className="text-[10px] text-slate-500 dark:text-slate-500 block mt-0.5">
                  {loginTime}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
