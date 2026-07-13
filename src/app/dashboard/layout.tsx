import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import DashboardClientLayout from '@/components/layout/dashboard-client-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // TypeScript narrowing — session is guaranteed non-null past this point
  const user = session.user;

  // Fetch avatar and notifications in parallel instead of one after another —
  // they're independent queries, no reason to serialize them.
  const [dbUser, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar: true },
    }),
    prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    }),
  ]);

  return (
    <DashboardClientLayout
      user={{
        name: user.name || 'User',
        role: user.role,
        avatar: dbUser?.avatar ?? user.image ?? null,
      }}
      notifications={JSON.parse(JSON.stringify(notifications))}
    >
      {children}
    </DashboardClientLayout>
  );
}
