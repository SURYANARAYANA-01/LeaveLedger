import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createHolidaySchema } from '@/lib/validators/holiday';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const holidays = await prisma.holiday.findMany({
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ success: true, data: holidays });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createHolidaySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid holiday data', errors: parsed.error.format() }, { status: 400 });
    }

    const { name, date, isOptional, description } = parsed.data;
    const holidayDate = new Date(date);
    const year = holidayDate.getFullYear();

    // Check if holiday already exists on this date
    const existing = await prisma.holiday.findFirst({
      where: {
        date: holidayDate,
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, message: 'A holiday is already scheduled on this date' }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: holidayDate,
        year,
        isOptional,
        description,
      },
    });

    return NextResponse.json({ success: true, data: holiday });
  } catch (error) {
    console.error('Error creating holiday:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Holiday ID required' }, { status: 400 });
    }

    const holiday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      return NextResponse.json({ success: false, message: 'Holiday not found' }, { status: 404 });
    }

    await prisma.holiday.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
