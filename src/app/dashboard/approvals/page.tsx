import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ApprovalList from '@/components/approvals/approval-list';
import { ShieldCheck } from 'lucide-react';
import type { UserRole } from '@prisma/client';

export default async function ApprovalsPage() {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== 'MANAGER' &&
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'CEO')
  ) {
    redirect('/dashboard');
  }

  const userId = session.user.id;
  const role = session.user.role as UserRole;

  /**
   * Hierarchy:
   *   CEO   → approves ADMIN leave requests (managerId = CEO id)
   *   ADMIN → approves MANAGER leave requests (managerId = ADMIN id)
   *   MANAGER → approves EMPLOYEE leave requests (managerId = MANAGER id)
   *
   * In all cases, exclude requests submitted by the current reviewer themselves.
   */
  const whereCondition = {
    status: 'PENDING' as const,
    // Never show the reviewer's own requests
    userId: { not: userId },
    user: {
      managerId: userId,
    },
  };

  const requests = await prisma.leaveRequest.findMany({
    where: whereCondition,
    include: {
      user: {
        select: { id: true, name: true, role: true, avatar: true, managerId: true },
      },
      leaveType: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const roleLabel =
    role === 'CEO'
      ? 'HR Admin'
      : role === 'ADMIN'
      ? 'Manager'
      : 'Employee';

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Approvals Queue <ShieldCheck className="w-5 h-5 text-indigo-500" />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Review and approve/reject pending leave requests from your direct reports ({roleLabel}s).
        </p>
      </div>

      <ApprovalList requests={JSON.parse(JSON.stringify(requests))} />
    </div>
  );
}
