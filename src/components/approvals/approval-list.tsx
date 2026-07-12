'use client';

import React, { useState } from 'react';
import { formatDateRange } from '@/lib/utils';
import { Check, X, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface LeaveRequestItem {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  user: { id: string; name: string; role: string; avatar: string | null; managerId: string | null };
  leaveType: { id: string; name: string; color: string };
}

interface ApprovalListProps {
  requests: LeaveRequestItem[];
}

export default function ApprovalList({ requests: initialRequests }: ApprovalListProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequestItem[]>(initialRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<(LeaveRequestItem & { action: 'APPROVED' | 'REJECTED' }) | null>(null);
  const [note, setNote] = useState('');

  const handleAction = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    setProcessingId(requestId);
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action, note }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Request ${action.toLowerCase()} successfully!`);
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        setSelectedRequest(null);
        setNote('');
        router.refresh();
      } else {
        toast.error(result.message || 'Action failed.');
      }
    } catch (e) {
      toast.error('An error occurred.');
    } finally {
      setProcessingId(null);
    }
  };

  const openActionModal = (request: LeaveRequestItem, action: 'APPROVED' | 'REJECTED') => {
    setSelectedRequest({ ...request, action });
    setNote('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Approvals Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-450 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-450 uppercase tracking-wider">
                  Leave Details
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-450 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-450 uppercase tracking-wider">
                  Chargeable Days
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-450 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-450 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    No pending approval requests.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                    {/* Employee Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {request.user.name[0]}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-850 dark:text-slate-200 block">
                            {request.user.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 block">
                            {request.user.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Leave Type Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: request.leaveType.color }}
                        />
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {request.leaveType.name}
                        </span>
                      </div>
                    </td>

                    {/* Period */}
                    <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {formatDateRange(request.startDate, request.endDate)}
                    </td>

                    {/* Days */}
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {request.totalDays} {request.totalDays === 1 ? 'day' : 'days'}
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {request.reason}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openActionModal(request, 'APPROVED')}
                          disabled={processingId !== null}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 dark:text-emerald-400 rounded-lg cursor-pointer transition-all border border-emerald-250/10 text-xs font-bold flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => openActionModal(request, 'REJECTED')}
                          disabled={processingId !== null}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:text-rose-400 rounded-lg cursor-pointer transition-all border border-rose-250/10 text-xs font-bold flex items-center space-x-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dialog/Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Confirm {selectedRequest.action === 'APPROVED' ? 'Approval' : 'Rejection'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You are reviewing the request for {selectedRequest.user.name}.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Request Summary</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {selectedRequest.leaveType.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDateRange(selectedRequest.startDate, selectedRequest.endDate)} • {selectedRequest.totalDays} day(s)
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 italic mt-2 block border-t border-slate-100 dark:border-slate-800/60 pt-2">
                  &ldquo;{selectedRequest.reason}&rdquo;
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Approver Comments (Optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Provide any comments or instructions..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <button
                onClick={() => handleAction(selectedRequest.id, selectedRequest.action)}
                disabled={processingId !== null}
                className={`px-5 py-2.5 rounded-xl font-semibold text-white shadow-sm flex items-center space-x-2 cursor-pointer ${
                  selectedRequest.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {processingId === selectedRequest.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Submit Action</span>
                )}
              </button>
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
