import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';

// Personal leave dashboard for Manager / HR (Admin) roles.
// Shows the same "my leave" view employees see, since managers and admins
// also accrue and take leave themselves — separate from their team/approval
// dashboard at /dashboard.
export default async function MyLeavePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = session.user.id;
  const role = session.user.role;

  // Only MANAGER and ADMIN have a separate personal view here.
  // EMPLOYEE already sees this at /dashboard, CEO doesn't request leave here.
  if (role !== 'MANAGER' && role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: new Date(),
      },
    },
    orderBy: {
      date: 'asc',
    },
    take: 5,
  });

  const currentYear = new Date().getFullYear();
  const [leaveBalances, recentRequests, statsGroup, userDetail, upcomingLeaves] = await Promise.all([
    prisma.leaveBalance.findMany({
      where: { userId, year: currentYear },
      include: { leaveType: true },
    }),
    prisma.leaveRequest.findMany({
      where: { userId },
      include: { leaveType: true, approver: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.leaveRequest.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: { select: { name: true } },
        manager: { select: { name: true } },
      },
    }),
    prisma.leaveRequest.findMany({
      where: {
        userId,
        startDate: { gte: new Date() },
        status: 'APPROVED',
      },
      include: { leaveType: true },
      orderBy: { startDate: 'asc' },
      take: 3,
    }),
  ]);

  const totalPending = statsGroup.find((g) => g.status === 'PENDING')?._count.id || 0;
  const totalApproved = statsGroup.find((g) => g.status === 'APPROVED')?._count.id || 0;
  const totalRejected = statsGroup.find((g) => g.status === 'REJECTED')?._count.id || 0;

  const leaveTypeBalances = leaveBalances.map((balance) => ({
    id: balance.leaveTypeId,
    name: balance.leaveType.name,
    allocated: balance.allocated,
    used: balance.used,
    pending: balance.pending,
    color: balance.leaveType.color || '#4F46E5',
  }));

  return (
    <EmployeeDashboard
      user={{
        name: userDetail?.name || session.user.name || 'User',
        role: userDetail?.role || role,
        department: userDetail?.department,
        manager: userDetail?.manager,
      }}
      stats={{
        totalPending,
        totalApproved,
        totalRejected,
        leaveTypeBalances,
        recentRequests: JSON.parse(JSON.stringify(recentRequests)),
        upcomingHolidays: JSON.parse(JSON.stringify(holidays)),
        upcomingLeaves: JSON.parse(JSON.stringify(upcomingLeaves)),
      }}
    />
  );
}
