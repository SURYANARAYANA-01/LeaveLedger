'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applyLeaveSchema, ApplyLeaveInput } from '@/lib/validators/leave';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { formatDateRange, getStatusColor } from '@/lib/utils';
import DashboardHeader from './dashboard-header';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  Loader2,
  ShieldCheck,
  X,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Sun,
  HeartPulse,
  Home,
  Baby,
  CalendarDays,
} from 'lucide-react';

interface LeaveRequestItem {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  leaveType: { id: string; name: string; color: string };
  approver?: { name: string } | null;
  approverNote?: string | null;
}

interface HolidayItem {
  id: string;
  name: string;
  date: string;
  isOptional: boolean;
  description: string | null;
}

interface EmployeeDashboardProps {
  user: {
    name: string;
    role: string;
    department?: { name: string } | null;
    manager?: { name: string } | null;
  };
  stats: {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    leaveTypeBalances: {
      id: string;
      name: string;
      allocated: number;
      used: number;
      pending: number;
      color: string;
    }[];
    recentRequests: LeaveRequestItem[];
    upcomingHolidays: HolidayItem[];
    upcomingLeaves: LeaveRequestItem[];
  };
}

// Icon mapper for leave types
const getLeaveIcon = (name: string) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('annual') || lowercaseName.includes('vacation')) return Sun;
  if (lowercaseName.includes('sick') || lowercaseName.includes('medical')) return HeartPulse;
  if (lowercaseName.includes('home') || lowercaseName.includes('wfh') || lowercaseName.includes('remote')) return Home;
  if (lowercaseName.includes('maternity') || lowercaseName.includes('paternity')) return Baby;
  return CalendarDays;
};

export default function EmployeeDashboard({ user, stats }: EmployeeDashboardProps) {
  const router = useRouter();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplyLeaveInput>({
    resolver: zodResolver(applyLeaveSchema),
    defaultValues: {
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      dayType: 'FULL_DAY',
      reason: '',
    },
  });

  const onSubmitQuickLeave = async (data: ApplyLeaveInput) => {
    setSubmitLoading(true);
    try {
      const response = await fetch('/api/leave/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Leave requested successfully!');
        reset();
        setIsDrawerOpen(false);
        router.refresh();
        window.location.reload();
      } else {
        toast.error(result.message || 'Failed to submit leave request.');
      }
    } catch (e) {
      toast.error('An error occurred.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    
    setCancellingId(requestId);
    try {
      const response = await fetch('/api/leave/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Request cancelled successfully!');
        router.refresh();
        window.location.reload();
      } else {
        toast.error(result.message || 'Failed to cancel request.');
      }
    } catch (e) {
      toast.error('An error occurred.');
    } finally {
      setCancellingId(null);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };


  // Dynamic values for KPI Cards
  const totalApprovedAndRejected = stats.totalApproved + stats.totalRejected;
  const approvalRate = totalApprovedAndRejected > 0 
    ? Math.round((stats.totalApproved / totalApprovedAndRejected) * 100)
    : 100;

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      
      {/* 1. Dashboard Header with profile context */}
      <DashboardHeader user={user} />

      {/* 2. KPI Cards with small context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Pending',
            value: stats.totalPending,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-950/10',
            border: 'border-amber-200 dark:border-amber-800/60',
            glow: 'shadow-amber-500/5',
            hoverGlow: 'hover:shadow-amber-500/10',
            icon: Clock,
            context: stats.totalPending > 0 ? '+1 since yesterday' : 'All caught up!',
          },
          {
            title: 'Approved',
            value: stats.totalApproved,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/10',
            border: 'border-emerald-200 dark:border-emerald-800/60',
            glow: 'shadow-emerald-500/5',
            hoverGlow: 'hover:shadow-emerald-500/10',
            icon: CheckCircle2,
            context: `${approvalRate}% approval rate`,
          },
          {
            title: 'Rejected',
            value: stats.totalRejected,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-950/10',
            border: 'border-rose-200 dark:border-rose-800/60',
            glow: 'shadow-rose-500/5',
            hoverGlow: 'hover:shadow-rose-500/10',
            icon: XCircle,
            context: stats.totalRejected > 0 ? 'Last rejected 14 days ago' : 'No rejections in 30d',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl border ${item.border} ${item.bg} flex items-center justify-between shadow-lg ${item.glow} ${item.hoverGlow} hover:-translate-y-1 transition-all duration-300`}
            >
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                  {item.title}
                </span>
                <span className={`text-4xl font-black mt-2 block ${item.color}`}>
                  {item.value}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block font-medium">
                  {item.context}
                </span>
              </div>
              <div className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border ${item.border} shadow-sm`}>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Leave Balances & (Upcoming Leave, Holidays) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 9. Leave balance card with professional colors and hover */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Leave Balances (2026)
            </h2>
            <Link
              href="/dashboard/leave/history"
              className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View breakdown</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.leaveTypeBalances.map((balance, idx) => {
              const remaining = Math.max(0, balance.allocated - balance.used);
              const percentage = balance.allocated > 0 ? (balance.used / balance.allocated) * 100 : 0;
              const LeaveIcon = getLeaveIcon(balance.name);

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-350 dark:hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between relative overflow-hidden group"
                >
                  {/* Subtle color background glow on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] dark:group-hover:opacity-[0.04] transition-opacity duration-300 pointer-events-none"
                    style={{ backgroundColor: balance.color }}
                  ></div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="p-1.5 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${balance.color}15`, color: balance.color }}
                      >
                        <LeaveIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {balance.name}
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-3xl font-black text-slate-800 dark:text-slate-100">
                        {remaining}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        / {balance.allocated} days remaining
                      </span>
                    </div>
                    {balance.pending > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/20">
                        {balance.pending} days pending approval
                      </span>
                    )}
                  </div>

                  {/* Circular Progress Ring */}
                  <div className="relative w-16 h-16 relative z-10 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-slate-100 dark:text-slate-800"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        stroke={balance.color}
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={150.79}
                        strokeDashoffset={150.79 - (150.79 * percentage) / 100}
                        className="transition-all duration-700 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {Math.round(percentage)}% used
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Cards: Upcoming Leave & Upcoming Holidays */}
        <div className="space-y-6">
          
          {/* 5. Separate Upcoming Leave Card */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Upcoming Leave
            </h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              {stats.upcomingLeaves.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-455 font-medium">
                  No upcoming leaves planned.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.upcomingLeaves.map((leave, idx) => {
                    const LeaveIcon = getLeaveIcon(leave.leaveType.name);
                    const startDateObj = new Date(leave.startDate);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${leave.leaveType.color}15`, color: leave.leaveType.color }}
                          >
                            <LeaveIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-850 dark:text-slate-200 block truncate">
                              {leave.leaveType.name}
                            </span>
                            <span className="text-[10px] text-slate-455 block mt-0.5">
                              {leave.totalDays} {leave.totalDays === 1 ? 'Day' : 'Days'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 pl-2">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                            {startDateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {startDateObj.getFullYear()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Holidays */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Upcoming Holidays
              </h2>
              <Link
                href="/dashboard/holidays"
                className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:underline"
              >
                Full Calendar
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60">
              {stats.upcomingHolidays.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-455 font-medium">
                  No upcoming holidays.
                </div>
              ) : (
                stats.upcomingHolidays.map((holiday, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div className="min-w-0 pr-3">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate block">
                        {holiday.name}
                      </span>
                      <span className="text-[10px] text-slate-455 mt-0.5 block truncate">
                        {holiday.description || 'Public holiday'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/40 rounded-xl flex-shrink-0 text-indigo-655 dark:text-indigo-400">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider leading-none">
                        {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-sm font-black leading-none mt-1">
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

      {/* Row 3: Recent Requests */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Recent Leave Requests
        </h2>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                      No leave requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentRequests.map((request) => {
                    const isExpanded = expandedRow === request.id;
                    const isPending = request.status === 'PENDING';
                    
                    return (
                      <React.Fragment key={request.id}>
                        {/* Table Row */}
                        <tr 
                          onClick={() => toggleRow(request.id)}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: request.leaveType.color }}
                              />
                              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                {request.leaveType.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {formatDateRange(request.startDate, request.endDate)}
                          </td>
                          <td className="px-6 py-4 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            {request.totalDays} {request.totalDays === 1 ? 'day' : 'days'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(request.status)}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1"></span>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {isPending && (
                                <button
                                  onClick={(e) => handleCancelRequest(request.id, e)}
                                  disabled={cancellingId === request.id}
                                  className="px-2.5 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-250/20 rounded-lg transition-all"
                                >
                                  {cancellingId === request.id ? 'Cancelling...' : 'Cancel'}
                                </button>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable row detail */}
                        {isExpanded && (
                          <tr className="bg-slate-50/40 dark:bg-slate-900/30">
                            <td colSpan={5} className="px-6 py-4 border-l-2 border-indigo-500/50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1.5">
                                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Reason for request</span>
                                  <p className="text-slate-650 dark:text-slate-350 italic font-medium">
                                    &ldquo;{request.reason}&rdquo;
                                  </p>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Approval Details</span>
                                  {request.approver ? (
                                    <div className="space-y-1">
                                      <p className="text-slate-700 dark:text-slate-300 font-semibold">
                                        Reviewed by {request.approver.name}
                                      </p>
                                      {request.approverNote && (
                                        <p className="text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                          Note: {request.approverNote}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-slate-500 dark:text-slate-400">
                                      {isPending ? 'Awaiting manager approval.' : 'No approver details available.'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Quick Apply Floating Card Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-4 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-350 hover:scale-105 active:scale-95 cursor-pointer border border-white/10 group animate-bounce"
      >
        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        <span>Apply Leave</span>
      </button>

      {/* Slide-over Drawer Backdrop overlay */}
      {isDrawerOpen && (
        <div 
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 transition-opacity duration-300 animate-fade-in"
        />
      )}

      {/* Slide-over Quick Apply Drawer Container */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              <span>Quick Apply Leave</span>
            </h2>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmitQuickLeave)} className="space-y-4 mt-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Leave Type</label>
              <select
                {...register('leaveTypeId')}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select leave type</option>
                {stats.leaveTypeBalances.map((balance) => (
                  <option key={balance.id} value={balance.id}>
                    {balance.name} (Available: {Math.max(0, balance.allocated - balance.used)})
                  </option>
                ))}
              </select>
              {errors.leaveTypeId && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.leaveTypeId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Start Date</label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.startDate && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.startDate.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">End Date</label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.endDate && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.endDate.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Day Type</label>
              <select
                {...register('dayType')}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="FIRST_HALF">First Half (Morning)</option>
                <option value="SECOND_HALF">Second Half (Afternoon)</option>
              </select>
              {errors.dayType && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.dayType.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Reason</label>
              <textarea
                {...register('reason')}
                placeholder="Please describe the reason for your leave request (min 10 characters)..."
                rows={4}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.reason && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.reason.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-indigo-650/20 cursor-pointer transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting request...</span>
                </>
              ) : (
                <span>Submit Request</span>
              )}
            </button>
          </form>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Requests go to your manager for review. You will be notified of changes.</span>
        </div>
      </div>
    </div>
  );
}
