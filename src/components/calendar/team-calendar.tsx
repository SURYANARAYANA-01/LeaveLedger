'use client';

import React, { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Calendar as CalendarIcon,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    department: {
      id: string;
      name: string;
    } | null;
  };
  leaveType: {
    id: string;
    name: string;
    color: string;
  };
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  isOptional: boolean;
  description: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface CeoSchedule {
  id: string;
  userId: string;
  startDate: string | Date;
  endDate: string | Date;
  eventType: string;
  title: string;
  description: string | null;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface TeamCalendarProps {
  initialLeaves: LeaveRequest[];
  holidays: Holiday[];
  departments: Department[];
  ceoSchedule?: CeoSchedule[];
}

export default function TeamCalendar({ initialLeaves, holidays, departments, ceoSchedule = [] }: TeamCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const handlePrevMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Generate days for the grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const daysGrid = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  // Normalize dates for safe checking
  const parsedLeaves = useMemo(() => {
    return initialLeaves.map((l) => ({
      ...l,
      start: typeof l.startDate === 'string' ? parseISO(l.startDate) : new Date(l.startDate),
      end: typeof l.endDate === 'string' ? parseISO(l.endDate) : new Date(l.endDate),
    }));
  }, [initialLeaves]);

  const parsedHolidays = useMemo(() => {
    return holidays.map((h) => ({
      ...h,
      dateObj: typeof h.date === 'string' ? parseISO(h.date) : new Date(h.date),
    }));
  }, [holidays]);

  const parsedCeoSchedules = useMemo(() => {
    return ceoSchedule.map((s) => ({
      ...s,
      start: typeof s.startDate === 'string' ? parseISO(s.startDate) : new Date(s.startDate),
      end: typeof s.endDate === 'string' ? parseISO(s.endDate) : new Date(s.endDate),
    }));
  }, [ceoSchedule]);

  // Filter leaves based on selected department
  const filteredLeaves = useMemo(() => {
    if (selectedDept === 'ALL') return parsedLeaves;
    return parsedLeaves.filter((l) => l.user.department?.id === selectedDept);
  }, [parsedLeaves, selectedDept]);

  // Helper to find leaves for a given day
  const getLeavesForDay = (day: Date) => {
    return filteredLeaves.filter((leave) => {
      // Ensure date bounds are stripped of time
      const checkDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const sDate = new Date(leave.start.getFullYear(), leave.start.getMonth(), leave.start.getDate());
      const eDate = new Date(leave.end.getFullYear(), leave.end.getMonth(), leave.end.getDate());
      return checkDate >= sDate && checkDate <= eDate;
    });
  };

  // Helper to find CEO schedule for a given day
  const getCeoSchedulesForDay = (day: Date) => {
    return parsedCeoSchedules.filter((sched) => {
      const checkDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const sDate = new Date(sched.start.getFullYear(), sched.start.getMonth(), sched.start.getDate());
      const eDate = new Date(sched.end.getFullYear(), sched.end.getMonth(), sched.end.getDate());
      return checkDate >= sDate && checkDate <= eDate;
    });
  };

  // Helper to find holiday for a given day
  const getHolidayForDay = (day: Date) => {
    return parsedHolidays.find((h) => {
      const checkDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const hDate = new Date(h.dateObj.getFullYear(), h.dateObj.getMonth(), h.dateObj.getDate());
      return checkDate.getTime() === hDate.getTime();
    });
  };

  // Calculate day-by-day conflict warnings
  const conflictsMap = useMemo(() => {
    const conflicts: Record<string, string[]> = {}; // Key: ISO date, Value: departments with conflict
    
    // Group leaves by date and department
    daysGrid.forEach((day) => {
      const dayLeaves = parsedLeaves.filter((leave) => {
        const checkDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const sDate = new Date(leave.start.getFullYear(), leave.start.getMonth(), leave.start.getDate());
        const eDate = new Date(leave.end.getFullYear(), leave.end.getMonth(), leave.end.getDate());
        return checkDate >= sDate && checkDate <= eDate;
      });

      // Count leaves per department
      const deptCounts: Record<string, number> = {};
      dayLeaves.forEach((l) => {
        const deptName = l.user.department?.name || 'Unknown';
        deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
      });

      // If 2 or more members from the same department are off, flag it as a warning
      const dayConflicts: string[] = [];
      Object.entries(deptCounts).forEach(([deptName, count]) => {
        if (count >= 2) {
          dayConflicts.push(deptName);
        }
      });

      if (dayConflicts.length > 0) {
        const key = format(day, 'yyyy-MM-dd');
        conflicts[key] = dayConflicts;
      }
    });

    return conflicts;
  }, [daysGrid, parsedLeaves]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Top Filter & Control Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-650 dark:text-slate-350" />
          </button>
          <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-100 min-w-[140px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-650 dark:text-slate-350" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-colors ml-2"
          >
            Today
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-xs font-bold text-slate-455 space-x-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Department:</span>
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 text-center py-3">
          {weekdays.map((day) => (
            <span key={day} className="text-xs font-bold uppercase tracking-wider text-slate-455">
              {day}
            </span>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-slate-100 dark:divide-slate-800/80 -mt-[1px] -ml-[1px]">
          {daysGrid.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = isSameDay(day, new Date());
            const dayLeaves = getLeavesForDay(day);
            const ceoSchedules = getCeoSchedulesForDay(day);
            const holiday = getHolidayForDay(day);
            const conflictKey = format(day, 'yyyy-MM-dd');
            const dayConflicts = conflictsMap[conflictKey];

            return (
              <div
                key={idx}
                className={cn(
                  'p-2 flex flex-col justify-between transition-all relative group',
                  !isCurrentMonth && 'bg-slate-50/30 dark:bg-slate-950/20 text-slate-400',
                  isToday && 'bg-indigo-50/30 dark:bg-indigo-950/10'
                )}
              >
                {/* Day header info */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full',
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : isCurrentMonth
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400'
                    )}
                  >
                    {day.getDate()}
                  </span>

                  {/* Holiday Indicator */}
                  {holiday && (
                    <span
                      title={`${holiday.name} (${holiday.isOptional ? 'Restricted' : 'Public Holiday'})`}
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded cursor-help truncate max-w-[80px]',
                        holiday.isOptional
                          ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100/50'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-450 border border-emerald-100/50'
                      )}
                    >
                      {holiday.name}
                    </span>
                  )}

                  {/* Department Conflict Warn */}
                  {dayConflicts && !holiday && (
                    <div
                      title={`Conflict: Multiple employees on leave from: ${dayConflicts.join(', ')}`}
                      className="text-amber-500 hover:text-amber-600 cursor-help"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Leaves & CEO Schedules in this day */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 mt-1.5">
                  {ceoSchedules.map((sched) => (
                    <div
                      key={sched.id}
                      title={`👑 CEO: ${sched.user.name} - ${sched.eventType}: ${sched.title} (${sched.description || 'No description'})`}
                      className="px-1.5 py-0.5 rounded text-[10px] font-extrabold truncate flex items-center space-x-1 cursor-default bg-amber-500/10 dark:bg-amber-500/20 text-amber-605 dark:text-amber-400 border-l-[2.5px] border-amber-500"
                    >
                      <span className="truncate">
                        👑 CEO: {sched.title}
                      </span>
                    </div>
                  ))}

                  {dayLeaves.map((leave) => {
                    const isPending = leave.status === 'PENDING';
                    return (
                      <div
                        key={leave.id}
                        title={`${leave.user.name} - ${leave.leaveType.name} (${leave.reason}) [${leave.status}]`}
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate flex items-center space-x-1 cursor-default"
                        style={{
                          backgroundColor: isPending ? 'transparent' : `${leave.leaveType.color}15`,
                          color: leave.leaveType.color,
                          borderLeft: isPending
                            ? `2.5px dashed ${leave.leaveType.color}`
                            : `2.5px solid ${leave.leaveType.color}`,
                          border: isPending ? `1px dashed ${leave.leaveType.color}40` : 'none',
                        }}
                      >
                        <span className="truncate">
                          {leave.user.name.split(' ')[0]}{' '}
                          {isPending && <span className="text-[8px] font-normal italic opacity-80">(Pending)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Public Holiday</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Restricted Holiday</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-2.5 bg-slate-200 dark:bg-slate-800 border-l-[3px] border-indigo-650"></span>
            <span>Approved Leave</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-2.5 border border-dashed border-indigo-400 border-l-[3px] border-l-dashed bg-transparent"></span>
            <span>Pending Leave</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Overlap Alert (2+ team members off)</span>
          </div>
        </div>

        <div className="flex items-center text-xs text-indigo-650 dark:text-indigo-400 font-semibold gap-1.5">
          <Info className="w-4 h-4" />
          <span>Dates are automatically color-coded according to the leave type color settings.</span>
        </div>
      </div>
    </div>
  );
}
