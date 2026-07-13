import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validators/user';

// Public self-serve signup. Always creates exactly one new Company and its
// first user as CEO — there is no role field here, and none is accepted
// from the client, because this endpoint's only job is "start a new
// company's workspace." Every other account (HR, Manager, Employee) is
// created afterward by that CEO (or by HR, within their scope) via the
// authenticated /api/users route, never through this public endpoint.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid data', errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { companyName, name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName },
      });

      const ceo = await tx.user.create({
        data: {
          email,
          name,
          password: passwordHash,
          role: 'CEO',
          companyId: company.id,
        },
      });

      return { company, ceo };
    });

    return NextResponse.json({
      success: true,
      message: 'Company and CEO account created. You can now log in.',
      companyId: result.company.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
