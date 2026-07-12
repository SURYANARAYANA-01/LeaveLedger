import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { applyLeaveSchema } from '@/lib/validators/leave';
import { calculateBusinessDays } from '@/lib/utils';
import { DayType, LeaveStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'CEO') {
      return NextResponse.json({ success: false, message: 'The CEO does not submit leave requests.' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = applyLeaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid form data', errors: parsed.error.format() }, { status: 400 });
    }

    const { leaveTypeId, startDate, endDate, dayType = 'FULL_DAY', reason } = parsed.data;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch Leave Type configuration
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
    });

    if (!leaveType || !leaveType.isActive) {
      return NextResponse.json({ success: false, message: 'Leave type not found or inactive' }, { status: 404 });
    }

    // Fetch user details for manager information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { managerId: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (!user.managerId) {
      return NextResponse.json({ success: false, message: 'No reporting manager assigned. Please contact HR to configure your manager.' }, { status: 400 });
    }

    // Fetch holidays to calculate business days correctly
    const holidays = await prisma.holiday.findMany({
      select: { date: true },
    });
    const holidayDates = holidays.map((h) => h.date);

    // Calculate total days requested
    let totalDays = 0;
    if (dayType !== 'FULL_DAY') {
      totalDays = 0.5;
    } else {
      totalDays = calculateBusinessDays(start, end, holidayDates);
    }

    if (totalDays <= 0) {
      return NextResponse.json({ success: false, message: 'Requested period contains zero business days.' }, { status: 400 });
    }

    // Verify leave balance (for non-WFH, non-unpaid types)
    if (leaveType.name !== 'Work From Home' && leaveType.name !== 'Unpaid Leave') {
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          userId_leaveTypeId_year: {
            userId: session.user.id,
            leaveTypeId,
            year: 2026,
          },
        },
      });

      if (!balance) {
        return NextResponse.json({ success: false, message: 'Leave balance not initialized.' }, { status: 400 });
      }

      const availableDays = balance.allocated - balance.used - balance.pending;
      if (totalDays > availableDays) {
        return NextResponse.json({ success: false, message: 'Insufficient leave balance.' }, { status: 400 });
      }

      // Update pending balance
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pending: {
            increment: totalDays,
          },
        },
      });
    }

    // Create Leave Request
    const request = await prisma.leaveRequest.create({
      data: {
        userId: session.user.id,
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        dayType: dayType as DayType,
        reason,
        status: LeaveStatus.PENDING,
      },
    });

    // Notify manager if exists
    if (user.managerId) {
      await prisma.notification.create({
        data: {
          userId: user.managerId,
          title: 'New Leave Request',
          message: `${user.name} requested ${totalDays} day(s) of ${leaveType.name}.`,
          type: 'LEAVE_REQUEST',
          linkUrl: '/dashboard/approvals',
        },
      });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    console.error('Error applying leave:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
