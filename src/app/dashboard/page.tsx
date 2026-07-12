import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';
import ManagerDashboard from '@/components/dashboard/manager-dashboard';
import AdminDashboard from '@/components/dashboard/admin-dashboard';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = session.user.id;
  const role = session.user.role;

  // 1. Common Data: Upcoming Holidays
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

  if (role === 'CEO' || role === 'ADMIN') {
    // HR Admin / CEO Dashboard queries
    const [totalUsers, totalDepartments, activeRequestsCount, leaveTypes] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.department.count(),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.leaveType.findMany({ where: { isActive: true } }),
    ]);

    // Calculate distributions
    const requestsByType = await prisma.leaveRequest.groupBy({
      by: ['leaveTypeId'],
      _count: { id: true },
    });

    const leaveTypeDistribution = leaveTypes.map((type) => {
      const group = requestsByType.find((g) => g.leaveTypeId === type.id);
      return {
        name: type.name,
        count: group ? group._count.id : 0,
        color: type.color || '#4F46E5',
      };
    });

    return (
      <AdminDashboard
        stats={{
          totalUsers,
          totalDepartments,
          activeLeaveRequests: activeRequestsCount,
          leaveTypeDistribution,
          departmentLeaveRates: [],
        }}
        upcomingHolidays={JSON.parse(JSON.stringify(holidays))}
      />
    );
  }

  if (role === 'MANAGER') {
    // Manager Dashboard queries
    const [subordinatesCount, pendingApprovalsCount, onLeaveTodayCount, teamRequests] = await Promise.all([
      prisma.user.count({ where: { managerId: userId, isActive: true } }),
      prisma.leaveRequest.count({
        where: {
          status: 'PENDING',
          user: { managerId: userId },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          status: 'APPROVED',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          user: { managerId: userId },
        },
      }),
      prisma.leaveRequest.findMany({
        where: {
          user: { managerId: userId },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, role: true },
          },
          leaveType: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ]);

    return (
      <ManagerDashboard
        stats={{
          pendingApprovals: pendingApprovalsCount,
          teamSize: subordinatesCount,
          onLeaveToday: onLeaveTodayCount,
          teamRequests: JSON.parse(JSON.stringify(teamRequests)),
          recentTeamRequests: JSON.parse(JSON.stringify(teamRequests)),
        }}
        upcomingHolidays={JSON.parse(JSON.stringify(holidays))}
      />
    );
  }

  // EMPLOYEE Dashboard queries
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
        name: userDetail?.name || session.user.name || 'Employee',
        role: userDetail?.role || 'EMPLOYEE',
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
