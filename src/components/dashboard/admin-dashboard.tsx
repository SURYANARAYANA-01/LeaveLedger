'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Building,
  CalendarClock,
  Settings,
  Plus,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface AdminDashboardProps {
  stats: {
    totalUsers: number;
    totalDepartments: number;
    activeLeaveRequests: number;
    leaveTypeDistribution: { name: string; count: number; color: string }[];
    departmentLeaveRates: { name: string; rate: number }[];
  };
  upcomingHolidays: { id: string; name: string; date: string; isOptional: boolean; description: string | null }[];
}

export default function AdminDashboard({ stats, upcomingHolidays }: AdminDashboardProps) {
  const maxCount = Math.max(...stats.leaveTypeDistribution.map((d) => d.count), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/10 via-violet-900/5 to-slate-900/0 border border-indigo-500/10 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            HR Administration <ShieldCheck className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Global leave metrics, department analytics, user directories, and system settings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/users"
            className="inline-flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Employees</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Active Employees',
            value: stats.totalUsers,
            color: 'text-indigo-650 dark:text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            icon: Users,
            link: '/dashboard/users',
          },
          {
            title: 'Departments',
            value: stats.totalDepartments,
            color: 'text-violet-600 dark:text-violet-400',
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20',
            icon: Building,
            link: '/dashboard/users',
          },
          {
            title: 'Active Leave Requests',
            value: stats.activeLeaveRequests,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            icon: CalendarClock,
            link: '/dashboard/approvals',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.link}
              className={`p-6 rounded-2xl border ${item.border} ${item.bg} flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform duration-200`}
            >
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {item.title}
                </span>
                <span className={`text-3xl font-extrabold mt-2 block ${item.color}`}>
                  {item.value}
                </span>
              </div>
              <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 border ${item.border}`}>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Row 2: Analytics & Upcoming Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leave Type Utilization Distribution */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Leave Request Distribution
            </h2>
            <Link
              href="/dashboard/reports"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Export Full Analytics</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-5">
            {stats.leaveTypeDistribution.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No leave request history found.
              </div>
            ) : (
              stats.leaveTypeDistribution.map((dist, idx) => {
                const percentage = (dist.count / maxCount) * 100;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-slate-700 dark:text-slate-350 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dist.color }} />
                        <span>{dist.name}</span>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {dist.count} {dist.count === 1 ? 'request' : 'requests'}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: dist.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Holidays */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Upcoming Holidays
            </h2>
            <Link
              href="/dashboard/holidays"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Full Calendar
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80">
            {upcomingHolidays.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No upcoming holidays.
              </div>
            ) : (
              upcomingHolidays.map((holiday, idx) => (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate block">
                      {holiday.name}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      {holiday.description || 'Public holiday'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-3 py-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/40 rounded-xl flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-base font-extrabold leading-none mt-0.5">
                      {new Date(holiday.date).getDate()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
