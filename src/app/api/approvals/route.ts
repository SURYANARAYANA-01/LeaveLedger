import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { approveLeaveSchema } from '@/lib/validators/leave';
import { LeaveStatus, UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== 'MANAGER' &&
        session.user.role !== 'ADMIN' &&
        session.user.role !== 'CEO')
    ) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = approveLeaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload', errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { requestId, action, note } = parsed.data;

    // Fetch the Leave Request with the applicant's details
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        leaveType: true,
        user: { select: { id: true, name: true, role: true, managerId: true } },
      },
    });

    if (!request) {
      return NextResponse.json({ success: false, message: 'Leave request not found' }, { status: 404 });
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: 'Request is already processed' }, { status: 400 });
    }

    // Prevent self-approval
    if (request.user.id === session.user.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot approve your own leave request.' },
        { status: 400 }
      );
    }

    // Enforce hierarchy: the approver must be the direct manager of the applicant
    // Employee -> MANAGER approves, Manager -> ADMIN approves, Admin -> CEO approves
    const approverRole = session.user.role as UserRole;
    const applicantRole = request.user.role as UserRole;

    const hierarchyMap: Record<UserRole, UserRole | null> = {
      EMPLOYEE: 'MANAGER',
      MANAGER: 'ADMIN',
      ADMIN: 'CEO',
      CEO: null,
    };

    const expectedApproverRole = hierarchyMap[applicantRole];

    if (expectedApproverRole === null) {
      return NextResponse.json(
        { success: false, message: 'The CEO does not require approval.' },
        { status: 400 }
      );
    }

    if (approverRole !== expectedApproverRole) {
      return NextResponse.json(
        {
          success: false,
          message: `A ${applicantRole.toLowerCase()}'s leave must be approved by a ${expectedApproverRole.toLowerCase()}.`,
        },
        { status: 403 }
      );
    }

    // For MANAGER role: ensure the applicant directly reports to this manager
    if (approverRole === 'MANAGER' && request.user.managerId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'You are not the direct manager of this employee.' },
        { status: 403 }
      );
    }

    // For ADMIN role: ensure the applicant (a manager) directly reports to this admin
    if (approverRole === 'ADMIN' && request.user.managerId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'This manager does not report to you.' },
        { status: 403 }
      );
    }

    // For CEO role: ensure the applicant (an admin) directly reports to this CEO
    if (approverRole === 'CEO' && request.user.managerId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'This HR Admin does not report to you.' },
        { status: 403 }
      );
    }

    // Process balances for non-WFH, non-unpaid types
    if (request.leaveType.name !== 'Work From Home' && request.leaveType.name !== 'Unpaid Leave') {
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          userId_leaveTypeId_year: {
            userId: request.user.id,
            leaveTypeId: request.leaveTypeId,
            year: new Date().getFullYear(),
          },
        },
      });

      if (balance) {
        if (action === 'APPROVED') {
          await prisma.leaveBalance.update({
            where: { id: balance.id },
            data: {
              pending: { decrement: request.totalDays },
              used: { increment: request.totalDays },
            },
          });
        } else {
          await prisma.leaveBalance.update({
            where: { id: balance.id },
            data: {
              pending: { decrement: request.totalDays },
            },
          });
        }
      }
    }

    // Update Leave Request status
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: action as LeaveStatus,
        approverId: session.user.id,
        approverNote: note || null,
        reviewedAt: new Date(),
      },
    });

    // Notify the employee
    await prisma.notification.create({
      data: {
        userId: request.user.id,
        title: `Leave Request ${action === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: `Your request for ${request.totalDays} day(s) of ${request.leaveType.name} was ${action.toLowerCase()} by ${session.user.name}.`,
        type: `LEAVE_${action}`,
        linkUrl: '/dashboard/leave/history',
      },
    });

    return NextResponse.json({ success: true, data: updatedRequest });
  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
