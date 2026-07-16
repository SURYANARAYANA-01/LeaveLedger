import React from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import HolidayManager from '@/components/holidays/holiday-manager';
import { redirect } from 'next/navigation';

export default async function HolidaysPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const holidays = await prisma.holiday.findMany({
    orderBy: { date: 'asc' },
  });

  const isHR = session.user.role === 'HR' || session.user.role === 'CEO';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Holiday Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">
          View upcoming public holidays and company days off.
        </p>
      </div>

      <HolidayManager holidays={JSON.parse(JSON.stringify(holidays))} isHR={isHR} />
    </div>
  );
}
