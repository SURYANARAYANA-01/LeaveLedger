'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  CalendarCheck2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface AdminDashboardProps {
  role: 'ADMIN' | 'CEO';
  userName: string;
  stats: {
    activeEmployees: number;
    activeLeaveRequests: number;
    onLeaveToday: number;
    leaveTypeDistribution: { name: string; count: number; color: string }[];
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

  // Compact, self-contained donut: big ring filling a square box, short
  // radial "pulse" line on hover (inside the SVG), and a floating HTML
  // tooltip positioned near the hovered segment (avoids any SVG viewBox
  // clipping/overflow issues since it's normal HTML, clamped in JS).
  const BOX = 260;
  const CX = BOX / 2;
  const CY = BOX / 2;
  const R = 95;
  const STROKE = 34;
  const CIRC = 2 * Math.PI * R;
  const LINE_OUT = 9;

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
      const outX = CX + (R + LINE_OUT) * Math.cos(rad);
      const outY = CY + (R + LINE_OUT) * Math.sin(rad);

      // Tooltip anchor as a clamped percentage of the box, a bit further
      // out than the line so it doesn't sit on top of the ring.
      const tipX = CX + (R + LINE_OUT + 8) * Math.cos(rad);
      const tipY = CY + (R + LINE_OUT + 8) * Math.sin(rad);
      const tooltipXPct = Math.min(88, Math.max(12, (tipX / BOX) * 100));
      const tooltipYPct = Math.min(90, Math.max(10, (tipY / BOX) * 100));

      const segLen = Math.hypot(outX - onRingX, outY - onRingY);

      return {
        ...dist,
        pct,
        startDeg,
        sweepDeg,
        onRingX,
        onRingY,
        outX,
        outY,
        tooltipXPct,
        tooltipYPct,
        segLen,
      };
    });
  }, [stats.leaveTypeDistribution, totalRequests]);

  const hovered = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/10 via-violet-900/5 to-slate-900/0 border border-indigo-500/10 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            👋 {greeting}, {firstName} <ShieldCheck className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {role === 'CEO'
              ? 'Executive overview of company-wide leave metrics, headcount, and department analytics.'
              : 'Global leave metrics, department analytics, user directories, and system settings.'}
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
            title: 'Active Employees',
            value: stats.activeEmployees,
            color: 'text-indigo-650 dark:text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            icon: Users,
            link: '/dashboard/users',
          },
          {
            title: 'Pending Approvals',
            value: stats.activeLeaveRequests,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            icon: Clock,
            link: '/dashboard/approvals',
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
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Donut - left */}
                <div className="relative flex-shrink-0" style={{ width: BOX, height: BOX }}>
                  <svg viewBox={`0 0 ${BOX} ${BOX}`} width={BOX} height={BOX} role="img" aria-label="Donut chart of leave requests by type">
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
                        strokeWidth={hoveredIdx === idx ? STROKE + 5 : STROKE}
                        strokeDasharray={`${(seg.pct * CIRC).toFixed(2)} ${CIRC.toFixed(2)}`}
                        strokeDashoffset={(-((seg.startDeg / 360) * CIRC)).toFixed(2)}
                        transform={`rotate(-90 ${CX} ${CY})`}
                        style={{ transition: 'stroke-width 200ms ease', cursor: seg.count > 0 ? 'pointer' : 'default', opacity: seg.count === 0 ? 0.35 : 1 }}
                        onMouseEnter={() => seg.count > 0 && setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      />
                    ))}

                    <text x={CX} y={CY - 6} textAnchor="middle" className="fill-slate-800 dark:fill-slate-100" style={{ fontSize: 30, fontWeight: 700 }}>
                      {totalRequests}
                    </text>
                    <text x={CX} y={CY + 16} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 12 }}>
                      total requests
                    </text>

                    {/* Short animated pulse line drawing outward on hover */}
                    {segments.map((seg, idx) => {
                      const isHovered = hoveredIdx === idx;
                      return (
                        <g key={`leader-${idx}`} style={{ pointerEvents: 'none' }}>
                          <line
                            x1={seg.onRingX}
                            y1={seg.onRingY}
                            x2={seg.outX}
                            y2={seg.outY}
                            stroke={seg.color}
                            strokeWidth={2}
                            strokeDasharray={seg.segLen}
                            strokeDashoffset={isHovered ? 0 : seg.segLen}
                            style={{ transition: 'stroke-dashoffset 300ms ease' }}
                          />
                          <circle
                            cx={seg.outX}
                            cy={seg.outY}
                            r={3}
                            fill={seg.color}
                            style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 150ms ease 250ms' }}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Floating tooltip, plain HTML so it can never be clipped by an SVG viewBox */}
                  {hovered && (
                    <div
                      className="absolute pointer-events-none bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 whitespace-nowrap transition-all duration-200"
                      style={{
                        left: `${hovered.tooltipXPct}%`,
                        top: `${hovered.tooltipYPct}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                      }}
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{hovered.name}</div>
                    </div>
                  )}
                </div>

                {/* Legend - right */}
                <div className="flex-1 w-full space-y-1.5">
                  {segments.map((seg, idx) => (
                    <div
                      key={`legend-${idx}`}
                      onMouseEnter={() => seg.count > 0 && setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                        hoveredIdx === idx ? 'bg-slate-50 dark:bg-slate-800/60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{seg.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400 flex-shrink-0 ml-3">
                        {seg.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
