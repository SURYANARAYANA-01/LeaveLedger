import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid data', errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Fetch user with full profile to preserve role
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        inviteTokenExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'This invite link is invalid or has already been used.' },
        { status: 404 }
      );
    }

    if (!user.inviteTokenExpiry || user.inviteTokenExpiry < new Date()) {
      return NextResponse.json(
        { success: false, message: 'This invite link has expired. Ask your HR to resend it.' },
        { status: 410 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and activation status - role remains unchanged
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        isActive: true,
        inviteToken: null,
        inviteTokenExpiry: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    // Log for debugging - helps track role assignment
    console.log(`✅ User ${updatedUser.email} (${updatedUser.name}) activated with role: ${updatedUser.role}`);

    return NextResponse.json({
      success: true,
      message: 'Account activated. You can now sign in.',
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
