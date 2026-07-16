import Link from 'next/link';
import { CalendarX2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-6">
          <CalendarX2 className="w-10 h-10 text-indigo-500" />
        </div>
        <h1 className="text-5xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">404</h1>
        <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-3">
          This page took a leave of absence.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center mt-8 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}