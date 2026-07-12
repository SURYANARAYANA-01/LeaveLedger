'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createHolidaySchema, CreateHolidayInput } from '@/lib/validators/holiday';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Loader2 } from 'lucide-react';

interface HolidayItem {
  id: string;
  name: string;
  date: string | Date;
  isOptional: boolean;
  description: string | null;
}

interface HolidayManagerProps {
  holidays: HolidayItem[];
  isAdmin: boolean;
}

export default function HolidayManager({ holidays: initialHolidays, isAdmin }: HolidayManagerProps) {
  const router = useRouter();
  const [holidays, setHolidays] = useState<HolidayItem[]>(initialHolidays);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateHolidayInput>({
    resolver: zodResolver(createHolidaySchema),
    defaultValues: {
      name: '',
      date: '',
      isOptional: false,
      description: '',
    },
  });

  const onSubmit = async (data: CreateHolidayInput) => {
    setLoading(true);
    try {
      const response = await fetch('/api/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Holiday created successfully!');
        setHolidays((prev) => [...prev, result.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        reset();
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to create holiday.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/holidays?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Holiday deleted successfully!');
        setHolidays((prev) => prev.filter((h) => h.id !== id));
        router.refresh();
      } else {
        toast.error(result.message || 'Deletion failed.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Holidays List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80">
          {holidays.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No public holidays scheduled yet.
            </div>
          ) : (
            holidays.map((holiday) => (
              <div key={holiday.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="min-w-0 pr-3 flex items-start space-x-3">
                  <div className="flex flex-col items-center justify-center px-3 py-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/40 rounded-xl flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-base font-extrabold leading-none mt-0.5">
                      {new Date(holiday.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate block">
                      {holiday.name}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      {holiday.description || 'Public Holiday'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  {holiday.isOptional && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-250/20">
                      Restricted
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(holiday.id)}
                      disabled={deletingId === holiday.id}
                      className="p-2 text-slate-450 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-all border border-transparent hover:border-rose-250/10"
                    >
                      {deletingId === holiday.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Holiday Form (Admin Only) */}
      {isAdmin && (
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-500" />
              <span>Schedule Holiday</span>
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">
                Holiday Name
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Christmas Day"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">
                Date
              </label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.date && <p className="text-xs text-rose-500">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">
                Description
              </label>
              <textarea
                {...register('description')}
                placeholder="Brief description..."
                rows={2}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input type="checkbox" {...register('isOptional')} id="isOptional" className="rounded border-slate-300" />
              <label htmlFor="isOptional" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                Optional / Restricted Holiday
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <span>Schedule</span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
