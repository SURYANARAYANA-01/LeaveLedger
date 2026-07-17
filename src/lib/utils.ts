import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (startDate.toDateString() === endDate.toDateString()) {
    return formatDate(startDate);
  }
  return `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function calculateBusinessDays(startDate: Date, endDate: Date, holidays: Date[] = []): number {
  let count = 0;
  const current = new Date(startDate);
  const holidayStrings = holidays.map((h) => new Date(h).toDateString());

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayStrings.includes(current.toDateString())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30';
    case 'APPROVED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30';
    case 'REJECTED': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30';
    case 'CANCELLED': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-200 dark:border-slate-800/30';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'ADMIN': return 'HR';
    case 'CEO': return 'CEO';
    case 'MANAGER': return 'Manager';
    case 'EMPLOYEE': return 'Team Member';
    default: return role;
  }
}
