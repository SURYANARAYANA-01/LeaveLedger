'use client';

import React, { useState } from 'react';
import { formatDateRange, getStatusColor } from '@/lib/utils';
import { XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface LeaveRequestHistory {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  totalDays: number;
  reason: string;
  status: string;
  approverNote: string | null;
  leaveType: {
    id: string;
    name: string;
    color: string;
  };
}

interface HistoryListProps {
  requests: LeaveRequestHistory[];
}

export default function HistoryList({ requests: initialRequests }: HistoryListProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequestHistory[]>(initialRequests);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelRequest = async (requestId: string) => {
    setCancellingId(requestId);
    try {
      const response = await fetch(`/api/leave/cancel?id=${requestId}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Leave request cancelled successfully!');
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to cancel request.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
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
                Reason & Approver Notes
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-450">
                  No leave history records found.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                  {/* Leave Type */}
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

                  {/* Duration */}
                  <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {formatDateRange(request.startDate, request.endDate)}
                  </td>

                  {/* Days */}
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {request.totalDays} {request.totalDays === 1 ? 'day' : 'days'}
                  </td>

                  {/* Notes */}
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                        {request.reason}
                      </p>
                      {request.approverNote && (
                        <p className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800 italic mt-1 text-slate-500 block">
                          <strong>Note:</strong> {request.approverNote}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    {request.status === 'PENDING' ? (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={cancellingId === request.id}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{cancellingId === request.id ? 'Cancelling...' : 'Cancel'}</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">No actions</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
