export function AppLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
        <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400 [animation-delay:120ms]" />
        <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400 [animation-delay:240ms]" />
      </div>
    </div>
  )
}
