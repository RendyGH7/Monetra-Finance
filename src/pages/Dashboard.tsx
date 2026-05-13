import { Card } from '@/components/ui/Card'
import { useAuth } from '@/auth/useAuth'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <div className="text-2xl font-semibold">Dashboard</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">Ringkasan untuk {user?.email}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-slate-600 dark:text-slate-400">Pemasukan (bulan ini)</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">Rp 0</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-600 dark:text-slate-400">Pengeluaran (bulan ini)</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">Rp 0</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-600 dark:text-slate-400">Saldo bersih</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">Rp 0</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="min-h-[240px]">
          <div className="text-sm font-medium">Tren 30 hari</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Grafik akan muncul setelah ada transaksi.</div>
        </Card>
        <Card className="min-h-[240px]">
          <div className="text-sm font-medium">Anggaran bulan ini</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Buat anggaran untuk mulai memantau progres.</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="min-h-[220px]">
          <div className="text-sm font-medium">Transaksi terbaru</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Belum ada data.</div>
        </Card>
        <Card className="min-h-[220px]">
          <div className="text-sm font-medium">Portofolio ringkas</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Catat trade untuk melihat ringkasan portofolio.</div>
        </Card>
      </div>
    </div>
  )
}
