'use client';

import React, { useMemo, useState } from 'react';
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
  role: 'ADMIN' | 'CEO';
  userName: string;
  stats: {
    totalUsers: number;
    totalDepartments: number;
    activeLeaveRequests: number;
    leaveTypeDistribution: { name: string; count: number; color: string }[];
    departmentLeaveRates: { name: string; rate: number }[];
  };
  upcomingHolidays: { id: string; name: string; date: string; isOptional: boolean; description: string | null }[];
}

export default function AdminDashboard({ role, userName, stats, upcomingHolidays }: AdminDashboardProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [greeting, setGreeting] = useState('Welcome back');
  const firstName = userName.split(' ')[0];

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const CX = 130;
  const CY = 130;
  const R = 90;
  const STROKE = 34;
  const CIRC = 2 * Math.PI * R;

  const totalRequests = stats.leaveTypeDistribution.reduce((sum, d) => sum + d.count, 0);

  const segments = useMemo(() => {
    let cumulativeDeg = 0;
    return stats.leaveTypeDistribution.map((dist) => {
      const pct = totalRequests > 0 ? dist.count / totalRequests : 0;
      const sweepDeg = pct * 360;
      const startDeg = cumulativeDeg;
      cumulativeDeg += sweepDeg;
      const midDeg = startDeg + sweepDeg / 2 - 90;
      const rad = (midDeg * Math.PI) / 180;

      const onRingX = CX + R * Math.cos(rad);
      const onRingY = CY + R * Math.sin(rad);
      const outX = CX + (R + 26) * Math.cos(rad);
      const outY = CY + (R + 26) * Math.sin(rad);
      const isRight = Math.cos(rad) >= 0;
      const bendX = isRight ? Math.max(outX, CX + R + 40) : Math.min(outX, CX - R - 40);
      const tickX = isRight ? bendX + 26 : bendX - 26;

      const segLen =
        Math.hypot(outX - onRingX, outY - onRingY) +
        Math.hypot(bendX - outX, outY - outY) +
        Math.hypot(tickX - bendX, 0);

      return {
        ...dist,
        pct,
        startDeg,
        sweepDeg,
        onRingX,
        onRingY,
        outX,
        outY,
        bendX,
        tickX,
        isRight,
        segLen,
      };
    });
  }, [stats.leaveTypeDistribution, totalRequests]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/10 via-violet-900/5 to-slate-900/0 border border-indigo-500/10 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {greeting}, {firstName} <ShieldCheck className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {role === 'CEO'
              ? 'Executive overview of company-wide leave metrics, headcount, and department analytics.'
              : 'Global leave metrics, department analytics, user directories, and system settings.'}
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

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm">
            {stats.leaveTypeDistribution.length === 0 || totalRequests === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No leave request history found.
              </div>
            ) : (
              <>
                <svg viewBox="0 0 380 260" className="w-full h-auto" role="img" aria-label="Donut chart of leave requests by type">
                  <title>Leave request distribution</title>
                  <circle cx={CX} cy={CY} r={R} fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth={STROKE} />
                  {segments.map((seg, idx) => (
                    <circle
                      key={`arc-${idx}`}
                      cx={CX}
                      cy={CY}
                      r={R}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={hoveredIdx === idx ? STROKE + 4 : STROKE}
                      strokeDasharray={`${(seg.pct * CIRC).toFixed(2)} ${CIRC.toFixed(2)}`}
                      strokeDashoffset={(-((seg.startDeg / 360) * CIRC)).toFixed(2)}
                      transform={`rotate(-90 ${CX} ${CY})`}
                      style={{ transition: 'stroke-width 200ms ease', cursor: seg.count > 0 ? 'pointer' : 'default', opacity: seg.count === 0 ? 0.35 : 1 }}
                      onMouseEnter={() => seg.count > 0 && setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  ))}

                  <text x={CX} y={CY - 6} textAnchor="middle" className="fill-slate-800 dark:fill-slate-100" style={{ fontSize: 26, fontWeight: 700 }}>
                    {totalRequests}
                  </text>
                  <text x={CX} y={CY + 14} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11 }}>
                    total requests
                  </text>

                  {segments.map((seg, idx) => {
                    const isHovered = hoveredIdx === idx;
                    return (
                      <g key={`leader-${idx}`} style={{ pointerEvents: 'none' }}>
                        <polyline
                          points={`${seg.onRingX},${seg.onRingY} ${seg.outX},${seg.outY} ${seg.bendX},${seg.outY} ${seg.tickX},${seg.outY}`}
                          fill="none"
                          stroke={seg.color}
                          strokeWidth={1.5}
                          strokeDasharray={seg.segLen}
                          strokeDashoffset={isHovered ? 0 : seg.segLen}
                          style={{ transition: 'stroke-dashoffset 350ms ease' }}
                        />
                        <circle
                          cx={seg.onRingX}
                          cy={seg.onRingY}
                          r={3}
                          fill={seg.color}
                          style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 150ms ease' }}
                        />
                        <text
                          x={seg.tickX}
                          y={seg.outY - 8}
                          textAnchor={seg.isRight ? 'start' : 'end'}
                          className="fill-slate-800 dark:fill-slate-100"
                          style={{ fontSize: 12, fontWeight: 600, opacity: isHovered ? 1 : 0, transition: 'opacity 200ms ease 150ms' }}
                        >
                          {seg.name}
                        </text>
                        <text
                          x={seg.tickX}
                          y={seg.outY + 14}
                          textAnchor={seg.isRight ? 'start' : 'end'}
                          className="fill-slate-500 dark:fill-slate-400"
                          style={{ fontSize: 11, opacity: isHovered ? 1 : 0, transition: 'opacity 200ms ease 150ms' }}
                        >
                          {seg.count} {seg.count === 1 ? 'request' : 'requests'}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="flex flex-wrap gap-4 justify-center mt-2">
                  {segments.map((seg, idx) => (
                    <div
                      key={`legend-${idx}`}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer"
                      onMouseEnter={() => seg.count > 0 && setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
                      <span>{seg.name}</span>
                    </div>
                  ))}
                </div>
              </>
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
