'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applyLeaveSchema, ApplyLeaveInput } from '@/lib/validators/leave';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Loader2, Info } from 'lucide-react';
import { calculateBusinessDays, formatDate } from '@/lib/utils';

interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  color: string;
  requiresDocument: boolean;
}

interface ApplyFormProps {
  leaveTypes: LeaveType[];
  userBalances: {
    leaveTypeId: string;
    allocated: number;
    used: number;
    pending: number;
  }[];
  holidays: Date[];
}

export default function ApplyLeaveForm({ leaveTypes, userBalances, holidays }: ApplyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  const selectedLeaveTypeId = watch('leaveTypeId');
  const startDateStr = watch('startDate');
  const endDateStr = watch('endDate');
  const dayType = watch('dayType');

  const selectedLeaveType = leaveTypes.find((lt) => lt.id === selectedLeaveTypeId);
  const selectedBalance = userBalances.find((b) => b.leaveTypeId === selectedLeaveTypeId);
  const remainingDays = selectedBalance ? selectedBalance.allocated - selectedBalance.used : 0;

  // Calculate duration
  let computedDays = 0;
  if (startDateStr && endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (end >= start) {
      if (dayType !== 'FULL_DAY') {
        computedDays = 0.5;
      } else {
        computedDays = calculateBusinessDays(start, end, holidays);
      }
    }
  }

  const onSubmit = async (data: ApplyLeaveInput) => {
    if (computedDays <= 0) {
      toast.error('Calculated leave duration must be greater than 0 business days.');
      return;
    }

    if (computedDays > remainingDays && selectedLeaveType?.name !== 'Work From Home' && selectedLeaveType?.name !== 'Unpaid Leave') {
      toast.error('Insufficient leave balance for the requested duration.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/leave/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Leave request submitted successfully!');
        router.push('/dashboard/leave/history');
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to submit request.');
      }
    } catch (e) {
      toast.error('An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">
        New Request Details
      </h2>

      {/* Leave Type Select */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Leave Type
        </label>
        <select
          {...register('leaveTypeId')}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
        >
          <option value="">Select leave type</option>
          {leaveTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        {errors.leaveTypeId && (
          <p className="text-xs text-rose-500">{errors.leaveTypeId.message}</p>
        )}

        {/* Selected Balance Info Banner */}
        {selectedLeaveType && selectedBalance && (
          <div className="flex items-start space-x-2 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/30 p-3.5 rounded-xl mt-3">
            <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-700 dark:text-slate-350 block">
                {selectedLeaveType.name} Info
              </span>
              {selectedLeaveType.description && (
                <p className="mt-0.5">{selectedLeaveType.description}</p>
              )}
              <div className="mt-2 flex space-x-4">
                <span>Allocated: <strong>{selectedBalance.allocated}</strong> days</span>
                <span>Used: <strong>{selectedBalance.used}</strong> days</span>
                <span>Remaining: <strong className="text-indigo-600 dark:text-indigo-400">{remainingDays}</strong> days</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date Pickers Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              {...register('startDate')}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
            />
          </div>
          {errors.startDate && (
            <p className="text-xs text-rose-500">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            End Date
          </label>
          <div className="relative">
            <input
              type="date"
              {...register('endDate')}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
            />
          </div>
          {errors.endDate && (
            <p className="text-xs text-rose-500">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Day Type (Half day option) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Duration Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'FULL_DAY', label: 'Full Day' },
            { value: 'FIRST_HALF', label: 'First Half (AM)' },
            { value: 'SECOND_HALF', label: 'Second Half (PM)' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue('dayType', option.value as 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF')}
              className={`py-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                dayType === option.value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea Reason */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Reason for Leave
        </label>
        <textarea
          {...register('reason')}
          rows={4}
          placeholder="Brief details about the leave request..."
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder-slate-400 dark:placeholder-slate-600"
        />
        {errors.reason && (
          <p className="text-xs text-rose-500">{errors.reason.message}</p>
        )}
      </div>

      {/* Calculated Duration Display Card */}
      {computedDays > 0 && (
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Chargeable Days
          </span>
          <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
            {computedDays} {computedDays === 1 ? 'day' : 'days'}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50 transition-all flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <span>Submit Request</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold rounded-xl cursor-pointer transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
