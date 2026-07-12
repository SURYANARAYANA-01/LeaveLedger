import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import CeoScheduleManager from '@/components/ceo/ceo-schedule-manager';

export default async function CeoSchedulePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'CEO') {
    redirect('/dashboard');
  }

  // Fetch the schedules for this CEO
  const schedules = await prisma.ceoSchedule.findMany({
    where: { userId: session.user.id },
    orderBy: { startDate: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">CEO Schedule</h1>
        <p className="text-sm text-slate-500 mt-1">
          Record periods when you will be unavailable. Entries require no approval and notify HR Admins.
        </p>
      </div>

      <CeoScheduleManager initialSchedules={JSON.parse(JSON.stringify(schedules))} />
    </div>
  );
}
