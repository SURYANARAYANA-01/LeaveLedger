'use client';

import React, { useState } from 'react';
import Sidebar from './sidebar';
import Topbar from './topbar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  LayoutDashboard,
  ClipboardList,
  History,
  CalendarDays,
  ShieldCheck,
  Calendar,
  Users,
  FileSpreadsheet,
  User,
  LogOut
} from 'lucide-react';
import { signOut } from 'next-auth/react';

import { Notification } from '@prisma/client';

interface DashboardClientLayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'HR' | 'CEO';
    avatar: string | null;
  };
  notifications: Notification[];
}

export default function DashboardClientLayout({
  children,
  user,
  notifications,
}: DashboardClientLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const getMenuItems = () => {
    const items = [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['EMPLOYEE', 'MANAGER', 'HR', 'CEO'],
      },
      {
        label: 'Apply Leave',
        href: '/dashboard/leave/apply',
        icon: ClipboardList,
        roles: ['EMPLOYEE', 'MANAGER', 'HR'],
      },
      {
        label: 'CEO Schedule',
        href: '/dashboard/ceo-schedule',
        icon: ClipboardList,
        roles: ['CEO'],
      },
      {
        label: 'Leave History',
        href: '/dashboard/leave/history',
        icon: History,
        roles: ['EMPLOYEE', 'MANAGER', 'HR'],
      },
      {
        label: 'Team Calendar',
        href: '/dashboard/calendar',
        icon: CalendarDays,
        roles: ['EMPLOYEE', 'MANAGER', 'HR', 'CEO'],
      },
      {
        label: 'Approvals Queue',
        href: '/dashboard/approvals',
        icon: ShieldCheck,
        roles: ['MANAGER', 'HR', 'CEO'],
      },
      {
        label: 'Holidays',
        href: '/dashboard/holidays',
        icon: Calendar,
        roles: ['EMPLOYEE', 'MANAGER', 'HR', 'CEO'],
      },
      {
        label: 'User Directory',
        href: '/dashboard/users',
        icon: Users,
        roles: ['HR'],
      },
      {
        label: 'Reports & Export',
        href: '/dashboard/reports',
        icon: FileSpreadsheet,
        roles: ['HR'],
      },
      {
        label: 'Profile',
        href: '/dashboard/profile',
        icon: User,
        roles: ['EMPLOYEE', 'MANAGER', 'HR', 'CEO'],
      },
    ];

    return items.filter((item) => item.roles.includes(user.role));
  };

  const menuItems = getMenuItems();

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch (e) {
      console.error('Failed to mark all notifications as read:', e);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar for Desktop */}
      <Sidebar role={user.role} userName={user.name} />

      {/* Mobile Drawer (Overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-full max-w-xs bg-slate-900 text-slate-100 h-full p-6 shadow-2xl z-50 border-r border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <Link href="/dashboard" className="flex items-center space-x-2" onClick={toggleMobileMenu}>
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-extrabold text-lg tracking-tight text-white">
                  LeaveLedger
                </span>
              </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={toggleMobileMenu}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-slate-800 mt-6">
              <div className="flex items-center justify-between bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl mb-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-300 font-semibold truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {user.role === 'HR' ? 'HR' : user.role === 'CEO' ? 'CEO' : user.role === 'MANAGER' ? 'Manager' : 'Team Member'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          userName={user.name}
          userRole={user.role}
          userAvatar={user.avatar}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          toggleMobileMenu={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-slate-50/50 dark:bg-slate-950/40 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
