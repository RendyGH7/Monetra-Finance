import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { enqueueOutbox } from '@/lib/offlineOutbox'
import { logAudit } from '@/lib/audit'

type Budget = {
  id: string
  user_id: string
  period: string
  category: string
  limit_amount: string
  currency: string
  created_at: string
}

const defaultCategories = ['Makanan', 'Transport', 'Tagihan', 'Belanja', 'Lainnya']

export default function Budgets() {
  const { user } = useAuth()
  const [items, setItems] = useState<Budget[]>([])
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [category, setCategory] = useState(defaultCategories[0])
  const [limitAmount, setLimitAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  async function load() {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: qErr } = await supabase
      .from('budgets')
      .select('*')
      .eq('period', period)
      .order('created_at', { ascending: false })
    if (qErr) {
      setError(qErr.message)
      setItems([])
      setLoading(false)
      return
    }
    setItems((data ?? []) as Budget[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [user, period])

  async function addBudget() {
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const payload = {
        user_id: user.id,
        period,
        category,
        limit_amount: Number(limitAmount || 0),
        currency: 'IDR',
      }

      if (!navigator.onLine) {
        enqueueOutbox({ id: `budget_${Date.now()}`, table: 'budgets', payload })
        setItems((prev) => [
          {
            id: `local_${Date.now()}`,
            user_id: user.id,
            period,
            category,
            limit_amount: String(payload.limit_amount),
            currency: 'IDR',
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
        logAudit('budgets.create.offline', 'medium')
      } else {
        const { error: insErr } = await supabase.from('budgets').insert(payload)
        if (insErr) throw insErr
        logAudit('budgets.create', 'low')
        await load()
      }

      setLimitAmount('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan anggaran')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <div className="text-2xl font-semibold">Anggaran</div>
        <div className="text-sm text-slate-400">Atur limit per kategori dan periode.</div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <div className="text-sm font-medium">Buat anggaran</div>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1">
              <div className="text-sm text-slate-700 dark:text-slate-300">Periode</div>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} type="month" />
            </div>
            <div className="grid gap-1">
              <div className="text-sm text-slate-700 dark:text-slate-300">Kategori</div>
              <select
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {defaultCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <div className="text-sm text-slate-700 dark:text-slate-300">Limit</div>
              <Input value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} inputMode="decimal" placeholder="1000000" />
            </div>
            {error ? (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">{error}</div>
            ) : null}
            <Button onClick={addBudget} disabled={busy || !limitAmount}>
              {busy ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Daftar anggaran ({period})</div>
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Memuat…' : 'Refresh'}
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            {items.map((it) => (
              <div key={it.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{it.category}</div>
                  <div className="text-sm tabular-nums">{new Intl.NumberFormat('id-ID').format(Number(it.limit_amount))}</div>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">IDR</div>
              </div>
            ))}
            {!loading && items.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada anggaran.</div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
