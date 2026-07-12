import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import HistoryList from '@/components/leave/history-list';
import { History } from 'lucide-react';

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Fetch leave requests for the user
  const requests = await prisma.leaveRequest.findMany({
    where: { userId },
    include: {
      leaveType: true,
      approver: { select: { name: true } },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Leave History <History className="w-5 h-5 text-indigo-500" />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Review all your submitted leave requests, approval notes, and statuses.
        </p>
      </div>

      <HistoryList requests={JSON.parse(JSON.stringify(requests))} />
    </div>
  );
}
