import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import UserDirectory from '@/components/users/user-directory';

export default async function UsersPage() {
  const session = await auth();

  // Route protection - admin only
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch users with their department and manager relations
  const users = await prisma.user.findMany({
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

  // Fetch potential managers (users with MANAGER or ADMIN role)
  const managers = await prisma.user.findMany({
    where: {
      role: { in: ['MANAGER', 'ADMIN'] },
      isActive: true,
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
      />
    </div>
  );
}
