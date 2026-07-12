'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  Users,
  CheckSquare,
  Filter,
  Sparkles,
  Info
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason: string;
  appliedAt: string;
  user: {
    name: string;
    email: string;
    department: {
      name: string;
    } | null;
  };
  leaveType: {
    name: string;
    color: string;
  };
}

interface LeaveReportsProps {
  leaveRequests: LeaveRequest[];
  departmentStats: { name: string; count: number }[];
  monthlyStats: { month: string; count: number }[];
  leaveTypeStats: { name: string; count: number; color: string }[];
}

export default function LeaveReports({
  leaveRequests,
  departmentStats,
  monthlyStats,
  leaveTypeStats,
}: LeaveReportsProps) {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filter leaves for the table
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((r) => {
      const matchesDept = selectedDept === 'ALL' || r.user.department?.name === selectedDept;
      const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
      return matchesDept && matchesStatus;
    });
  }, [leaveRequests, selectedDept, selectedStatus]);

  // Unique departments for filtering
  const departmentsList = useMemo(() => {
    const depts = new Set<string>();
    leaveRequests.forEach((r) => {
      if (r.user.department?.name) depts.add(r.user.department.name);
    });
    return Array.from(depts);
  }, [leaveRequests]);

  // CSV Export handler
  const exportToCSV = () => {
    const headers = ['Employee Name', 'Email', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Status', 'Applied On', 'Reason'];
    const rows = filteredRequests.map((r) => [
      r.user.name,
      r.user.email,
      r.user.department?.name || 'No Dept',
      r.leaveType.name,
      formatDate(r.startDate),
      formatDate(r.endDate),
      r.totalDays.toString(),
      r.status,
      formatDate(r.appliedAt || r.startDate), // fallback to startDate if no appliedAt
      r.reason.replace(/,/g, ';'), // prevent CSV break
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Leave_Ledger_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats cards computations
  const totalApprovedDays = useMemo(() => {
    return leaveRequests
      .filter((r) => r.status === 'APPROVED')
      .reduce((sum, r) => sum + r.totalDays, 0);
  }, [leaveRequests]);

  const activeEmployeesOnLeave = useMemo(() => {
    const today = new Date();
    return leaveRequests.filter((r) => {
      if (r.status !== 'APPROVED') return false;
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      return today >= start && today <= end;
    }).length;
  }, [leaveRequests]);

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Total Requests</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-850 dark:text-slate-100">{leaveRequests.length}</span>
            <span className="text-xs font-semibold text-slate-400">All statuses</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Days Approved</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-850 dark:text-slate-100">{totalApprovedDays} d</span>
            <span className="text-xs font-semibold text-emerald-500">Paid & unpaid</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Currently On Leave</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-850 dark:text-slate-100">{activeEmployeesOnLeave}</span>
            <span className="text-xs font-semibold text-indigo-500">Out of office today</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Pending Approvals</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 font-indigo">
              {leaveRequests.filter((r) => r.status === 'PENDING').length}
            </span>
            <span className="text-xs font-semibold text-amber-500">Awaiting manager</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-850 dark:text-slate-200">Monthly Request Trends</h2>
            <p className="text-xs text-slate-400 mt-1">Number of requests submitted per month in 2026</p>
          </div>
          <div className="h-64 mt-4 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Type Allocation Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-850 dark:text-slate-200">Leave Type Distribution</h2>
            <p className="text-xs text-slate-400 mt-1">Breakdown by categorized leave type</p>
          </div>
          <div className="h-48 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveTypeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {leaveTypeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                {leaveTypeStats.reduce((sum, e) => sum + e.count, 0)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {leaveTypeStats.map((entry, idx) => (
              <div key={idx} className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></span>
                <span className="truncate">{entry.name}: {entry.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Comparison Bar Chart */}
        <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-850 dark:text-slate-200">Leave Rates by Department</h2>
          <p className="text-xs text-slate-400 mt-1">Comparison of total leave counts by department</p>
          <div className="h-64 mt-4 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filterable Leave Table & Export */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-base font-bold text-slate-850 dark:text-slate-200">Leave Data Export</h2>
            <p className="text-xs text-slate-455 mt-0.5">Filter leave records and download CSV reports.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs font-bold uppercase bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-650 dark:text-slate-350"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs font-bold uppercase bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-650 dark:text-slate-350"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <button
              onClick={exportToCSV}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-850/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Leave Type</th>
                <th className="px-5 py-3.5">Period</th>
                <th className="px-5 py-3.5">Days</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-455">
                    No matching leave records found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      <div>
                        <div>{request.user.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{request.user.email}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{request.user.department?.name || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: request.leaveType.color }}></span>
                        <span>{request.leaveType.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {formatDate(request.startDate)} to {formatDate(request.endDate)}
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">{request.totalDays}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border',
                          request.status === 'APPROVED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50'
                            : request.status === 'PENDING'
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100/50'
                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100/50'
                        )}
                      >
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
