import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validators/user';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type } = body;

    if (type === 'profile') {
      const parsed = updateProfileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: 'Invalid profile data', errors: parsed.error.format() }, { status: 400 });
      }

      const { name, phone, avatar } = parsed.data;

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name,
          phone,
          avatar,
        },
      });

      return NextResponse.json({ success: true, data: { name: updatedUser.name } });
    }

    if (type === 'password') {
      const parsed = changePasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: 'Invalid password data', errors: parsed.error.format() }, { status: 400 });
      }

      const { currentPassword, newPassword } = parsed.data;

      // Fetch user's current password hash
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!user) {
  return NextResponse.json(
    { success: false, message: 'User not found' },
    { status: 404 }
  );
}

// Google-authenticated users don't have a password
if (!user.password) {
  return NextResponse.json(
    {
      success: false,
      message: 'This account uses Google Sign-In. Password cannot be changed.',
    },
    { status: 400 }
  );
}

// Verify current password
const passwordValid = await bcrypt.compare(currentPassword, user.password);
      if (!passwordValid) {
        return NextResponse.json({ success: false, message: 'Incorrect current password' }, { status: 400 });
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    return NextResponse.json({ success: false, message: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}