import { describe, it, expect } from 'vitest';
import {
  calculateBusinessDays,
  formatDate,
  formatDateRange,
  getStatusColor,
  getRoleLabel,
} from '@/lib/utils';

describe('calculateBusinessDays', () => {
  it('counts a single weekday as 1 day', () => {
    // Monday
    const day = new Date('2026-07-13T00:00:00');
    expect(calculateBusinessDays(day, day)).toBe(1);
  });

  it('excludes weekends from a full week', () => {
    // Mon Jul 13 – Sun Jul 19, 2026: 5 weekdays, 2 weekend days
    const start = new Date('2026-07-13T00:00:00');
    const end = new Date('2026-07-19T00:00:00');
    expect(calculateBusinessDays(start, end)).toBe(5);
  });

  it('returns 0 for a range that is entirely a weekend', () => {
    // Sat Jul 18 – Sun Jul 19, 2026
    const start = new Date('2026-07-18T00:00:00');
    const end = new Date('2026-07-19T00:00:00');
    expect(calculateBusinessDays(start, end)).toBe(0);
  });

  it('excludes a holiday that falls on a weekday', () => {
    // Mon Jul 13 – Fri Jul 17, 2026: 5 weekdays, minus 1 holiday (Wed Jul 15)
    const start = new Date('2026-07-13T00:00:00');
    const end = new Date('2026-07-17T00:00:00');
    const holidays = [new Date('2026-07-15T00:00:00')];
    expect(calculateBusinessDays(start, end, holidays)).toBe(4);
  });

  it('does not double-subtract a holiday that falls on a weekend', () => {
    const start = new Date('2026-07-13T00:00:00');
    const end = new Date('2026-07-19T00:00:00');
    const holidays = [new Date('2026-07-18T00:00:00')]; // Saturday
    expect(calculateBusinessDays(start, end, holidays)).toBe(5);
  });
});

describe('formatDateRange', () => {
  it('collapses to a single date when start and end are the same day', () => {
    const day = '2026-07-13T00:00:00';
    expect(formatDateRange(day, day)).toBe(formatDate(day));
  });

  it('renders a range with an em dash when dates differ', () => {
    const start = '2026-07-13T00:00:00';
    const end = '2026-07-15T00:00:00';
    expect(formatDateRange(start, end)).toBe(`${formatDate(start)} — ${formatDate(end)}`);
  });
});

describe('getStatusColor', () => {
  it('returns a distinct class set for each known status', () => {
    const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
    const results = statuses.map(getStatusColor);
    // No two known statuses should resolve to an identical class string —
    // a real bug (e.g. a copy-paste error) would collapse two of these.
    expect(new Set(results).size).toBe(statuses.length);
  });

  it('falls back to a neutral style for an unknown status', () => {
    expect(getStatusColor('SOMETHING_UNEXPECTED')).toBe('bg-slate-100 text-slate-600');
  });
});

describe('getRoleLabel', () => {
  it('maps the ADMIN enum value to the HR display label', () => {
    // Regression guard: this previously had a broken switch case
    // (`case 'HR'` instead of `case 'ADMIN'`) which meant real ADMIN role
    // values fell through to the default and were never actually labeled.
    expect(getRoleLabel('ADMIN')).toBe('HR');
    expect(getRoleLabel('ADMIN')).not.toMatch(/admin/i);
  });

  it('labels every real role value, not just some of them', () => {
    expect(getRoleLabel('CEO')).toBe('CEO');
    expect(getRoleLabel('MANAGER')).toBe('Manager');
    expect(getRoleLabel('EMPLOYEE')).toBe('Team Member');
  });
});
