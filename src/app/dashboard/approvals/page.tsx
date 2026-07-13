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
   * Approval scope (not just direct reports, but everyone that role level
   * is responsible for reviewing), grouped into separate sections:
   *   MANAGER → Employee requests only (single section)
   *   ADMIN (HR) → Manager requests + Employee requests (two sections)
   *   CEO → Manager requests + HR requests (two sections)
   * In all cases, exclude the reviewer's own requests.
   */
  const scopedRoles: UserRole[] =
    role === 'MANAGER' ? ['EMPLOYEE'] : role === 'ADMIN' ? ['MANAGER', 'EMPLOYEE'] : ['MANAGER', 'ADMIN'];

  const requests = await prisma.leaveRequest.findMany({
    where: {
      status: 'PENDING',
      userId: { not: userId },
      user: { role: { in: scopedRoles } },
    },
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

  const roleLabel: Record<string, string> = {
    ADMIN: 'HR Admin',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
  };

  const groupedRequests = scopedRoles.map((r) => ({
    role: r,
    label: roleLabel[r],
    list: requests.filter((req) => req.user.role === r),
  }));

  const scopeSummary = scopedRoles.map((r) => `${roleLabel[r]}s`).join(' and ');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Approvals Queue <ShieldCheck className="w-5 h-5 text-indigo-500" />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Review and approve/reject pending leave requests from {scopeSummary}.
        </p>
      </div>

      {scopedRoles.length === 1 ? (
        <ApprovalList requests={JSON.parse(JSON.stringify(requests))} />
      ) : (
        <div className="space-y-8">
          {groupedRequests.map((group) => (
            <div key={group.role} className="space-y-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                {group.label}
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                  {group.list.length}
                </span>
              </h2>
              <ApprovalList requests={JSON.parse(JSON.stringify(group.list))} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
