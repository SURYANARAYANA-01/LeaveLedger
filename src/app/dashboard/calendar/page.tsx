import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import TeamCalendar from '@/components/calendar/team-calendar';

export default async function CalendarPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const companyId = session.user.companyId;

  // Fetch approved and pending leaves for the team calendar
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      status: {
        in: ['APPROVED', 'PENDING'],
      },
      user: { companyId },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      leaveType: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  // Fetch holidays
  const holidays = await prisma.holiday.findMany({
    orderBy: {
      date: 'asc',
    },
  });

  // Fetch departments
  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Fetch CEO schedules
  const ceoSchedule = await prisma.ceoSchedule.findMany({
    where: { user: { companyId } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Team Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track team availability, leaves, and holidays across all departments.
        </p>
      </div>

      <TeamCalendar
        initialLeaves={JSON.parse(JSON.stringify(leaves))}
        holidays={JSON.parse(JSON.stringify(holidays))}
        departments={departments}
        ceoSchedule={JSON.parse(JSON.stringify(ceoSchedule))}
      />
    </div>
  );
}
