import { Card } from '@/components/ui/Card'

export default function AdminCompliance() {
  return (
    <div className="grid gap-6">
      <div>
        <div className="text-2xl font-semibold">Compliance Console</div>
        <div className="text-sm text-slate-400">Internal only. Butuh role claim `compliance_admin`.</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-slate-400">Login gagal tinggi</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">0</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-400">QRIS gagal</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">0</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-400">Ekspor laporan</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">0</div>
        </Card>
      </div>

      <Card className="min-h-[260px]">
        <div className="text-sm font-medium">Audit explorer</div>
        <div className="mt-2 text-sm text-slate-400">Placeholder UI. Nanti isi query ke `audit_logs` dengan RLS admin.</div>
      </Card>
    </div>
  )
}

