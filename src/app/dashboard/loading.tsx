export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-24 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-28 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
        <div className="h-28 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
        <div className="h-28 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-80 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
        <div className="h-80 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
      </div>
    </div>
  );
}
