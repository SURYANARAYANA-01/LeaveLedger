'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCeoScheduleSchema, CreateCeoScheduleInput } from '@/lib/validators/ceo-schedule';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Calendar, Trash2, Plus, Loader2, Clock, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface CeoSchedule {
  id: string;
  eventType: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string | null;
}

interface CeoScheduleManagerProps {
  initialSchedules: CeoSchedule[];
}

const EVENT_TYPES = [
  'Vacation',
  'Business Trip',
  'Conference',
  'Client Meeting',
  'Work From Home',
  'Medical Leave',
  'Personal Time',
  'Other'
];

export default function CeoScheduleManager({ initialSchedules }: CeoScheduleManagerProps) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<CeoSchedule[]>(initialSchedules);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCeoScheduleInput>({
    resolver: zodResolver(createCeoScheduleSchema),
    defaultValues: {
      eventType: 'Vacation',
      title: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateCeoScheduleInput) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ceo-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Schedule entry created successfully!');
        setSchedules((prev) => [...prev, result.data].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
        reset();
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to create schedule entry.');
      }
    } catch (e) {
      toast.error('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/ceo-schedule?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Schedule entry deleted successfully!');
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        router.refresh();
      } else {
        toast.error(result.message || 'Deletion failed.');
      }
    } catch (e) {
      toast.error('An error occurred.');
    } finally {
      setDeletingId(null);
    }
  };

  const getEventBadgeStyle = (type: string) => {
    switch (type) {
      case 'Vacation': return 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border-sky-100/50';
      case 'Business Trip': return 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border-indigo-100/50';
      case 'Conference': return 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100/50';
      case 'Client Meeting': return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50';
      case 'Work From Home': return 'bg-teal-50 dark:bg-teal-950/20 text-teal-650 dark:text-teal-400 border-teal-100/50';
      case 'Medical Leave': return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100/50';
      case 'Personal Time': return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100/50';
      default: return 'bg-slate-50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 border-slate-150/50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Schedule entries list */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80">
          {schedules.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No unavailability periods scheduled yet.
            </div>
          ) : (
            schedules.map((schedule) => (
              <div key={schedule.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="min-w-0 pr-3 flex items-start space-x-3">
                  <div className="flex flex-col items-center justify-center px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-100/40 rounded-xl flex-shrink-0 text-amber-600 dark:text-amber-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {new Date(schedule.startDate).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-base font-extrabold leading-none mt-0.5">
                      {new Date(schedule.startDate).getDate()}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate block">
                      {schedule.title}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      {formatDate(schedule.startDate)} to {formatDate(schedule.endDate)}
                    </span>
                    {schedule.description && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block italic">
                        &ldquo;{schedule.description}&rdquo;
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getEventBadgeStyle(schedule.eventType)}`}>
                    {schedule.eventType}
                  </span>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    disabled={deletingId === schedule.id}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-all border border-transparent hover:border-rose-200/20"
                    title="Delete Entry"
                  >
                    {deletingId === schedule.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Schedule form */}
      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-500" />
            <span>Record Unavailable Period</span>
          </h2>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Event Type
            </label>
            <select
              {...register('eventType')}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.eventType && <p className="text-xs text-rose-500">{errors.eventType.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Title
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Attending HR Tech Summit"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Start Date
            </label>
            <input
              type="date"
              {...register('startDate')}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.startDate && <p className="text-xs text-rose-500">{errors.startDate.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              End Date
            </label>
            <input
              type="date"
              {...register('endDate')}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.endDate && <p className="text-xs text-rose-500">{errors.endDate.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              placeholder="Provide any details or backup contact info..."
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Entry</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
