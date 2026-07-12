import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ApplyLeaveForm from '@/components/leave/apply-form';
import { Sparkles } from 'lucide-react';

export default async function ApplyLeavePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = session.user.id;

  // 1. Fetch Leave Types
  const leaveTypes = await prisma.leaveType.findMany({
    where: { isActive: true },
  });

  // 2. Fetch User Balances
  const balances = await prisma.leaveBalance.findMany({
    where: { userId, year: 2026 },
  });

  // 3. Fetch Holiday Dates (for business days calculations)
  const holidays = await prisma.holiday.findMany({
    select: { date: true },
  });

  const holidayDates = holidays.map((h) => h.date);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Request Leave <Sparkles className="w-5 h-5 text-indigo-500" />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Please select your leave type, dates, and provide a clear reason.
        </p>
      </div>

      <ApplyLeaveForm
        leaveTypes={JSON.parse(JSON.stringify(leaveTypes))}
        userBalances={JSON.parse(JSON.stringify(balances))}
        holidays={JSON.parse(JSON.stringify(holidayDates))}
      />
    </div>
  );
}
