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

    const user = await prisma.user.findUnique({ where: { inviteToken: token } });

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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        isActive: true,
        inviteToken: null,
        inviteTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Account activated. You can now sign in.' });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
