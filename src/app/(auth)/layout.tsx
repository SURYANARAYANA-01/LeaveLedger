import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-700 rounded-full filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-violet-700 rounded-full filter blur-3xl opacity-20 animate-pulse delay-700" />
      
      <div className="w-full max-w-md p-4 z-10">
        {children}
      </div>
    </div>
  );
}
