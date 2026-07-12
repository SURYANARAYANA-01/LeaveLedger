import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { LeaveStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ success: false, message: 'Request ID required' }, { status: 400 });
    }

    // Fetch the Leave Request
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        leaveType: true,
      },
    });

    if (!request) {
      return NextResponse.json({ success: false, message: 'Leave request not found' }, { status: 404 });
    }

    if (request.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: 'Only pending requests can be cancelled' }, { status: 400 });
    }

    // Revert pending balances for non-WFH, non-unpaid types
    if (request.leaveType.name !== 'Work From Home' && request.leaveType.name !== 'Unpaid Leave') {
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          userId_leaveTypeId_year: {
            userId: session.user.id,
            leaveTypeId: request.leaveTypeId,
            year: 2026,
          },
        },
      });

      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pending: {
              decrement: request.totalDays,
            },
          },
        });
      }
    }

    // Update Leave Request status to CANCELLED
    const cancelledRequest = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveStatus.CANCELLED,
      },
    });

    return NextResponse.json({ success: true, data: cancelledRequest });
  } catch (error) {
    console.error('Error cancelling leave:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
