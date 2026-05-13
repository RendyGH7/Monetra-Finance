import type { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  TrendingUp,
  QrCode,
  Shield,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'

type Item = {
  to: string
  label: string
  icon: ReactNode
}

const navItems: Item[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/transactions', label: 'Transaksi', icon: <Receipt className="h-4 w-4" /> },
  { to: '/budgets', label: 'Anggaran', icon: <PiggyBank className="h-4 w-4" /> },
  { to: '/investments', label: 'Investasi', icon: <TrendingUp className="h-4 w-4" /> },
  { to: '/qris', label: 'QRIS', icon: <QrCode className="h-4 w-4" /> },
  { to: '/account', label: 'Akun', icon: <Shield className="h-4 w-4" /> },
]

export default function AppShell() {
  const { toggleTheme, isDark } = useTheme()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="text-lg font-semibold">Monetra</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Keuangan personal & bisnis</div>
            </div>

            <nav className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900/60">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                      isActive && 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
                    )
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900/60">
              <button
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={toggleTheme}
                type="button"
              >
                <span className="flex items-center gap-2">
                  {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  Mode
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{isDark ? 'Dark' : 'Light'}</span>
              </button>
              <button
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={async () => {
                  await signOut()
                  navigate('/login', { replace: true })
                }}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        </aside>

        <main className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:hidden">
            <div>
              <div className="text-lg font-semibold">Monetra</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Keuangan personal & bisnis</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="h-10 w-10 px-0" onClick={toggleTheme}>
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                className="h-10 w-10 px-0"
                onClick={async () => {
                  await signOut()
                  navigate('/login', { replace: true })
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  )
}
