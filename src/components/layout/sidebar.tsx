'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  Users,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  History,
  Sparkles,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN' | 'CEO';
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  const getMenuItems = () => {
    const items = [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['EMPLOYEE', 'MANAGER', 'ADMIN', 'CEO'],
      },
      {
        label: 'Apply Leave',
        href: '/dashboard/leave/apply',
        icon: ClipboardList,
        roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'],
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
        roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'],
      },
      {
        label: 'Team Calendar',
        href: '/dashboard/calendar',
        icon: CalendarDays,
        roles: ['EMPLOYEE', 'MANAGER', 'ADMIN', 'CEO'],
      },
      {
        label: 'Approvals Queue',
        href: '/dashboard/approvals',
        icon: ShieldCheck,
        roles: ['MANAGER', 'ADMIN', 'CEO'],
      },
      {
        label: 'Holidays',
        href: '/dashboard/holidays',
        icon: Calendar,
        roles: ['EMPLOYEE', 'MANAGER', 'ADMIN', 'CEO'],
      },
      {
        label: 'User Directory',
        href: '/dashboard/users',
        icon: Users,
        roles: ['ADMIN'],
      },
      {
        label: 'Reports & Export',
        href: '/dashboard/reports',
        icon: FileSpreadsheet,
        roles: ['ADMIN'],
      },
      {
        label: 'Profile',
        href: '/dashboard/profile',
        icon: User,
        roles: ['EMPLOYEE', 'MANAGER', 'ADMIN', 'CEO'],
      },
    ];

    return items.filter((item) => item.roles.includes(role));
  };

  const menuItems = getMenuItems();

  return (
    <div
      className={cn(
        'hidden md:flex flex-col h-screen bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 relative',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-200 to-slate-100 bg-clip-text text-transparent">
              LeaveLedger
            </span>
          )}
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100')} />
              {!collapsed && <span>{item.label}</span>}
              {collapsed && (
                <div className="absolute left-16 bg-slate-950 text-slate-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-800">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 p-1 rounded-full cursor-pointer transition-all z-40 hidden md:block"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800">
        {!collapsed ? (
          <div className="flex items-center justify-between bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl mb-3">
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-slate-300 font-semibold truncate">
                {userName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {role === 'ADMIN' ? 'HR Admin' : role === 'CEO' ? 'CEO' : role === 'MANAGER' ? 'Manager' : 'Team Member'}
              </span>
            </div>
          </div>
        ) : null}

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn(
            'w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer',
            collapsed && 'px-0'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
