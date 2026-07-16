import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import LeaveReports from '@/components/reports/leave-reports';

export default async function ReportsPage() {
  const session = await auth();

  // Protect route - HR only
  if (!session?.user || session.user.role !== 'HR') {
    redirect('/dashboard');
  }

  // Fetch all leave requests
  const leaveRequests = await prisma.leaveRequest.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          department: {
            select: { name: true },
          },
        },
      },
      leaveType: {
        select: { name: true, color: true },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  // Calculate monthly stats
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyStats = months.map((m) => ({ month: m, count: 0 }));

  // Calculate department stats
  const departmentCounts: Record<string, number> = {};

  // Calculate leave type stats
  const leaveTypeCounts: Record<string, { count: number; color: string }> = {};

  leaveRequests.forEach((req) => {
    // Month count based on start date
    const monthIndex = new Date(req.startDate).getMonth();
    monthlyStats[monthIndex].count += 1;

    // Dept count
    const deptName = req.user.department?.name || 'No Department';
    departmentCounts[deptName] = (departmentCounts[deptName] || 0) + 1;

    // Leave type count
    const typeName = req.leaveType.name;
    const typeColor = req.leaveType.color || '#4F46E5';
    if (!leaveTypeCounts[typeName]) {
      leaveTypeCounts[typeName] = { count: 0, color: typeColor };
    }
    leaveTypeCounts[typeName].count += 1;
  });

  const departmentStats = Object.entries(departmentCounts).map(([name, count]) => ({
    name,
    count,
  }));

  const leaveTypeStats = Object.entries(leaveTypeCounts).map(([name, data]) => ({
    name,
    count: data.count,
    color: data.color,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Reports & Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor leave trends, department utilization rates, and download organizational data.
        </p>
      </div>

      <LeaveReports
        leaveRequests={JSON.parse(JSON.stringify(leaveRequests))}
        departmentStats={departmentStats}
        monthlyStats={monthlyStats}
        leaveTypeStats={leaveTypeStats}
      />
    </div>
  );
}
