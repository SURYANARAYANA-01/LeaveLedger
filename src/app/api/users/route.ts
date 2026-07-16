import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createUserSchema, updateUserSchema } from '@/lib/validators/user';
import { sendInviteEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const creatorRole = session?.user?.role;
    if (!session?.user || (creatorRole !== 'HR' && creatorRole !== 'MANAGER' && creatorRole !== 'CEO')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid data', errors: parsed.error.format() }, { status: 400 });
    }

    const { email, name, role: requestedRole, departmentId, managerId, phone } = parsed.data;

    // Never trust the payload's role — scope what each creator role may assign:
    // Manager -> Employee only; HR (HR) -> Manager or Employee (not HR);
    // CEO -> anything, including HR.
    let role = requestedRole;
    if (creatorRole === 'MANAGER') {
      role = 'EMPLOYEE';
    } else if (creatorRole === 'HR' && requestedRole === 'HR') {
      return NextResponse.json({ success: false, message: 'HR cannot create other HR accounts' }, { status: 403 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 400 });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: null, // set by the invited user themselves, once they verify
        role,
        companyId: session.user.companyId,
        departmentId: departmentId || null,
        managerId: managerId || null,
        phone: phone || null,
        isActive: false, // activated only once the invite link is used
        inviteToken,
        inviteTokenExpiry,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/accept-invite?token=${inviteToken}`;
    await sendInviteEmail(email, name, inviteUrl);

    // Initialize leave balances for the new user for the year 2026
    const leaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true },
    });

    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          userId: user.id,
          leaveTypeId: lt.id,
          year: 2026,
          allocated: lt.defaultDaysPerYear,
          used: 0,
          pending: 0,
          carriedOver: 0,
        },
      });
    }

    return NextResponse.json({ success: true, data: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const editorRole = session?.user?.role;
    if (!session?.user || (editorRole !== 'HR' && editorRole !== 'MANAGER' && editorRole !== 'CEO')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid data', errors: parsed.error.format() }, { status: 400 });
    }

    const { id, name, email, role: requestedRole, departmentId, managerId, isActive, phone } = parsed.data;

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (existing.companyId !== session.user.companyId) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Scope who each editor role may touch, and what role they may assign:
    // Manager -> Employees only, can't change role away from Employee.
    // HR (HR) -> Managers and Employees (not other HR), can't promote to HR.
    // CEO -> anyone, any role.
    let role = requestedRole;
    if (editorRole === 'MANAGER') {
      if (existing.role !== 'EMPLOYEE') {
        return NextResponse.json({ success: false, message: 'Managers can only edit employees' }, { status: 403 });
      }
      role = 'EMPLOYEE';
    } else if (editorRole === 'HR') {
      if (existing.role === 'HR') {
        return NextResponse.json({ success: false, message: 'HR cannot edit other HR accounts' }, { status: 403 });
      }
      if (requestedRole === 'HR') {
        return NextResponse.json({ success: false, message: 'HR cannot promote users to HR' }, { status: 403 });
      }
    }

    // Check if new email conflicts with another user
    if (email && email !== existing.email) {
      const conflict = await prisma.user.findUnique({
        where: { email },
      });
      if (conflict) {
        return NextResponse.json({ success: false, message: 'Email already in use' }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        departmentId: departmentId === undefined ? undefined : departmentId,
        managerId: managerId === undefined ? undefined : managerId,
        isActive,
        phone,
      },
    });

    return NextResponse.json({ success: true, data: { id: updatedUser.id, name: updatedUser.name } });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const deleterRole = session?.user?.role;
    if (!session?.user || (deleterRole !== 'HR' && deleterRole !== 'MANAGER' && deleterRole !== 'CEO')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing user id' }, { status: 400 });
    }

    if (id === session.user.id) {
      return NextResponse.json({ success: false, message: 'You cannot delete your own account' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (existing.companyId !== session.user.companyId) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Same review-scope rules as editing: Manager -> Employees only,
    // HR -> Manager + Employee (not other HR), CEO -> anyone.
    if (deleterRole === 'MANAGER' && existing.role !== 'EMPLOYEE') {
      return NextResponse.json({ success: false, message: 'Managers can only delete employees' }, { status: 403 });
    }
    if (deleterRole === 'HR' && existing.role === 'HR') {
      return NextResponse.json({ success: false, message: 'HR cannot delete other HR accounts' }, { status: 403 });
    }

    // Cascades to their leave requests/balances/notifications/schedules;
    // sets managerId/approverId/headId to null anywhere they're referenced
    // elsewhere, per the schema relations — never blocked by orphaned refs.
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
