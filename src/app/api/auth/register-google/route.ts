import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyGoogleHandoffToken } from '@/lib/auth';
import { z } from 'zod';

const bodySchema = z.object({
  token: z.string().min(1),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
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

    const { token, companyName } = parsed.data;

    let payload: { email: string; name: string };
    try {
      payload = await verifyGoogleHandoffToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: 'This registration link has expired. Please try "Continue with Google" again.' },
        { status: 401 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({ data: { name: companyName } });
      await tx.user.create({
        data: {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          password: null, // Google-only account — signs in exclusively via OAuth
          role: 'CEO',
          companyId: company.id,
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Company created. Continue with Google again to sign in.' });
  } catch (error) {
    console.error('Google registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
