import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCeoScheduleSchema } from '@/lib/validators/ceo-schedule';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'CEO') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createCeoScheduleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid schedule data', errors: parsed.error.format() }, { status: 400 });
    }

    const { eventType, title, startDate, endDate, description } = parsed.data;

    const schedule = await prisma.ceoSchedule.create({
      data: {
        userId: session.user.id,
        eventType,
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description || null,
      },
    });

    // Notify all HR Admins
    const hrAdmins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });

    for (const admin of hrAdmins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'CEO Schedule Update',
          message: `${session.user.name || 'CEO'} added a schedule entry: "${title}" (${eventType}) from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
          type: 'CEO_SCHEDULE',
          linkUrl: '/dashboard/calendar',
        },
      });
    }

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error creating CEO schedule:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const schedules = await prisma.ceoSchedule.findMany({
      orderBy: { startDate: 'asc' },
      include: {
        user: {
          select: { name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Error fetching CEO schedules:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'CEO') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    await prisma.ceoSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Schedule entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting CEO schedule:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
