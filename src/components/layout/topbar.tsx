'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn, getInitials } from '@/lib/utils';
import {
  Bell,
  Sun,
  Moon,
  Laptop,
  Check,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Notification } from '@prisma/client';

interface TopbarProps {
  userName: string;
  userRole: string;
  userAvatar: string | null;
  notifications: Notification[];
  onMarkRead?: (id: string) => Promise<void>;
  onMarkAllRead?: () => Promise<void>;
  toggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export default function Topbar({
  userName,
  userRole,
  userAvatar,
  notifications: initialNotifications = [],
  onMarkRead,
  onMarkAllRead,
  toggleMobileMenu,
  isMobileMenuOpen,
}: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkReadLocal = async (id: string) => {
    if (onMarkRead) {
      await onMarkRead(id);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllReadLocal = async () => {
    if (onMarkAllRead) {
      await onMarkAllRead();
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Mobile Toggle & Welcome (hidden on /dashboard which has its own header) */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleMobileMenu}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg md:hidden cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        {/* Hide welcome text on the main dashboard page — it has its own greeting */}
        {pathname !== '/dashboard' && (
          <div className="hidden md:flex flex-col">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
              Welcome back, {userName.split(' ')[0]}
            </p>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-tight mt-0.5">
              Good to see you!
            </span>
          </div>
        )}
      </div>

      {/* Right side: System Actions */}
      <div className="flex items-center space-x-3">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowThemeMenu(false);
              setShowProfileMenu(false);
            }}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllReadLocal}
                    className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkReadLocal(n.id)}
                      className={cn(
                        'p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all flex flex-col',
                        !n.isRead && 'bg-indigo-50/30 dark:bg-indigo-950/10'
                      )}
                    >
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {n.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {n.message}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-2">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Settings Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            {!mounted ? (
              <Laptop className="w-5 h-5" />
            ) : theme === 'dark' ? (
              <Moon className="w-5 h-5" />
            ) : theme === 'light' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Laptop className="w-5 h-5" />
            )}
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 p-1 space-y-1">
              {[
                { name: 'light', label: 'Light', icon: Sun },
                { name: 'dark', label: 'Dark', icon: Moon },
                { name: 'system', label: 'System', icon: Laptop },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.name}
                    onClick={() => {
                      setTheme(t.name);
                      setShowThemeMenu(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300',
                      mounted && theme === t.name && 'text-indigo-600 dark:text-indigo-400'
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </div>
                    {mounted && theme === t.name && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Profile Quick Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowThemeMenu(false);
            }}
            className="flex items-center space-x-2 p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all cursor-pointer"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {getInitials(userName)}
              </div>
            )}
            <ChevronDown className="w-4 h-4 text-slate-500 pr-1 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 p-1 space-y-1">
              <Link
                href="/dashboard/profile"
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <span>My Profile</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold text-rose-500 rounded-lg hover:bg-rose-500/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}