import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ProfileEditor from '@/components/profile/profile-editor';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch complete user profile data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      department: {
        select: { name: true },
      },
      manager: {
        select: { name: true },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details, view organizational info, and update your account password.
        </p>
      </div>

      <ProfileEditor user={JSON.parse(JSON.stringify(user))} />
    </div>
  );
}
