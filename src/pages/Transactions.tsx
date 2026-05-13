import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { enqueueOutbox } from '@/lib/offlineOutbox'
import { logAudit } from '@/lib/audit'

type TxType = 'income' | 'expense' | 'transfer'

type Transaction = {
  id: string
  user_id: string
  type: TxType
  category: string
  amount: string
  currency: string
  occurred_on: string
  note: string | null
  source: string
  created_at: string
}

const defaultCategories = ['Makanan', 'Transport', 'Tagihan', 'Belanja', 'Gaji', 'Lainnya']

export default function Transactions() {
  const { user } = useAuth()
  const [items, setItems] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<TxType>('expense')
  const [category, setCategory] = useState(defaultCategories[0])
  const [amount, setAmount] = useState('')
  const [occurredOn, setOccurredOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const total = useMemo(() => {
    return items.reduce((acc, it) => acc + Number(it.amount), 0)
  }, [items])

  async function load() {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: qErr } = await supabase
      .from('transactions')
      .select('*')
      .order('occurred_on', { ascending: false })
      .limit(50)

    if (qErr) {
      setError(qErr.message)
      setItems([])
      setLoading(false)
      return
    }

    setItems((data ?? []) as Transaction[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [user])

  async function addTransaction() {
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const payload = {
        user_id: user.id,
        type,
        category,
        amount: Number(amount || 0),
        currency: 'IDR',
        occurred_on: occurredOn,
        note: note || null,
        source: 'manual',
      }

      if (!navigator.onLine) {
        enqueueOutbox({
          id: `tx_${Date.now()}`,
          table: 'transactions',
          payload,
        })
        setItems((prev) => [
          {
            id: `local_${Date.now()}`,
            user_id: user.id,
            type,
            category,
            amount: String(payload.amount),
            currency: 'IDR',
            occurred_on: occurredOn,
            note: payload.note,
            source: 'offline',
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
        logAudit('transactions.create.offline', 'medium')
      } else {
        const { error: insErr } = await supabase.from('transactions').insert(payload)
        if (insErr) throw insErr
        logAudit('transactions.create', 'low')
        await load()
      }

      setAmount('')
      setNote('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menambah transaksi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Transaksi</div>
          <div className="text-sm text-slate-400">Catat transaksi manual dan lihat riwayat.</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Total 50 terakhir</div>
          <div className="text-lg font-semibold tabular-nums">{new Intl.NumberFormat('id-ID').format(total)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <div className="text-sm font-medium">Tambah transaksi</div>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1">
              <div className="text-sm text-slate-700 dark:text-slate-300">Tipe</div>
              <select
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                value={type}
                onChange={(e) => setType(e.target.value as TxType)}
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
                <option value="transfer">Transfer</option>
              </select>
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
              <div className="text-sm text-slate-700 dark:text-slate-300">Nominal</div>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="50000" />
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-slate-700 dark:text-slate-300">Tanggal</div>
              <Input value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} type="date" />
            </div>

            <div className="grid gap-1">
              <div className="text-sm text-slate-700 dark:text-slate-300">Catatan</div>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">{error}</div>
            ) : null}
            <Button onClick={addTransaction} disabled={busy || !amount}>
              {busy ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Riwayat</div>
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Memuat…' : 'Refresh'}
            </Button>
          </div>

          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Kategori</th>
                  <th className="py-2">Tipe</th>
                  <th className="py-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-slate-800">
                    <td className="py-2 text-slate-700 dark:text-slate-300">{it.occurred_on}</td>
                    <td className="py-2 text-slate-900 dark:text-slate-200">{it.category}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-400">{it.type}</td>
                    <td className="py-2 text-right tabular-nums">
                      <span
                        className={
                          it.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-300'
                            : it.type === 'expense'
                              ? 'text-rose-600 dark:text-rose-300'
                              : 'text-slate-900 dark:text-slate-100'
                        }
                      >
                        {new Intl.NumberFormat('id-ID').format(Number(it.amount))}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada transaksi.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
