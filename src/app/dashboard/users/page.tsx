import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import UserDirectory from '@/components/users/user-directory';

export default async function UsersPage() {
  const session = await auth();

  // Route protection - admin (full, minus other HR), manager (employees only), CEO (everyone)
  const role = session?.user?.role;
  if (!session?.user || (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'CEO')) {
    redirect('/dashboard');
  }

  const currentRole = role as 'ADMIN' | 'MANAGER' | 'CEO';
  const companyId = session.user.companyId;

  // Role-based visibility: managers see employees only, HR sees managers +
  // employees (not other HR accounts), CEO sees everyone. Always scoped to
  // the viewer's own company — this is a multi-tenant app, so without this
  // filter every company would see every other company's user directory.
  const visibleRoleFilter =
    currentRole === 'MANAGER'
      ? { role: 'EMPLOYEE' as const, companyId }
      : currentRole === 'ADMIN'
      ? { role: { in: ['MANAGER', 'EMPLOYEE'] as const }, companyId }
      : { companyId }; // CEO — sees everyone, but only within their own company

  // Fetch users with their department and manager relations
  const users = await prisma.user.findMany({
    where: visibleRoleFilter,
    include: {
      department: {
        select: { id: true, name: true },
      },
      manager: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Fetch departments
  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // Fetch potential managers (users with MANAGER or ADMIN role), same company only
  const managers = await prisma.user.findMany({
    where: {
      role: { in: ['MANAGER', 'ADMIN'] },
      isActive: true,
      companyId,
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Employee Directory</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage system users, assign roles and departments, and track employee accounts.
        </p>
      </div>

      <UserDirectory
        users={JSON.parse(JSON.stringify(users))}
        departments={departments}
        managers={managers}
        currentRole={currentRole}
      />
    </div>
  );
}
