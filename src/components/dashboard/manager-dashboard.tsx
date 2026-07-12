'use client';

import React from 'react';
import Link from 'next/link';
import { formatDateRange, getStatusColor } from '@/lib/utils';
import {
  Users,
  ShieldAlert,
  CalendarCheck2,
  Clock,
  ArrowRight,
  Check,
  X,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface LeaveRequestSummary {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  user: { id: string; name: string; email: string; avatar: string | null; role: string };
  leaveType: { id: string; name: string; color: string };
}

interface ManagerDashboardProps {
  userName: string;
  stats: {
    pendingApprovals: number;
    teamSize: number;
    onLeaveToday: number;
    teamRequests: LeaveRequestSummary[];
    recentTeamRequests: LeaveRequestSummary[];
  };
  upcomingHolidays: { id: string; name: string; date: string; isOptional: boolean; description: string | null }[];
}

export default function ManagerDashboard({ userName, stats, upcomingHolidays }: ManagerDashboardProps) {
  const router = useRouter();
  const [greeting, setGreeting] = React.useState('Welcome back');
  const firstName = userName.split(' ')[0];

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const handleQuickAction = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action, note: 'Quick review from dashboard.' }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Request ${action.toLowerCase()} successfully!`);
        router.refresh();
      } else {
        toast.error(result.message || 'Action failed.');
      }
    } catch (e) {
      toast.error('An error occurred.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/10 via-violet-900/5 to-slate-900/0 border border-indigo-500/10 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {greeting}, {firstName} <UserCheck className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Overview of team capacity, leave approvals queue, and calendar events.
          </p>
        </div>
        <Link
          href="/dashboard/approvals"
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-200 cursor-pointer self-start lg:self-center"
        >
          <span>Open Approvals Queue</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Pending Approvals',
            value: stats.pendingApprovals,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            icon: Clock,
            link: '/dashboard/approvals',
          },
          {
            title: 'Active Team Size',
            value: stats.teamSize,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            icon: Users,
            link: '/dashboard/calendar',
          },
          {
            title: 'On Leave Today',
            value: stats.onLeaveToday,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            icon: CalendarCheck2,
            link: '/dashboard/calendar',
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

      {/* Main Grid: Approvals Queue & Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Approvals Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Recent Team Requests
            </h2>
            <Link
              href="/dashboard/approvals"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage all requests
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden">
            {stats.teamRequests.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                No leave requests pending or submitted recently.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.teamRequests.map((request, idx) => (
                  <div
                    key={idx}
                    className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {request.user.name[0]}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
                          {request.user.name}
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5 block">
                          {request.leaveType.name} • {request.totalDays} {request.totalDays === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {formatDateRange(request.startDate, request.endDate)}
                    </div>

                    <div className="flex items-center space-x-3 self-end md:self-center">
                      {request.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleQuickAction(request.id, 'APPROVED')}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 dark:text-emerald-400 rounded-lg cursor-pointer transition-all border border-emerald-200/20"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleQuickAction(request.id, 'REJECTED')}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:text-rose-400 rounded-lg cursor-pointer transition-all border border-rose-200/20"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Holiday Calendar List */}
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
