import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { enqueueOutbox } from '@/lib/offlineOutbox'
import { logAudit } from '@/lib/audit'

type QrisPayment = {
  id: string
  user_id: string
  amount: string
  currency: string
  merchant_name: string | null
  status: string
  gateway_ref: string | null
  created_at: string
  updated_at: string
}

export default function QRIS() {
  const { user } = useAuth()
  const [mode, setMode] = useState<'scan' | 'generate'>('scan')
  const [payload, setPayload] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<QrisPayment[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('qris_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setItems((data ?? []) as QrisPayment[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [user])

  async function createPayment() {
    setBusy(true)
    setError(null)
    try {
      if (!user) return

      const rowPayload = {
        user_id: user.id,
        amount: Number(amount || 0),
        currency: 'IDR',
        merchant_name: null,
        status: 'pending',
        gateway_ref: null,
      }

      if (!navigator.onLine) {
        enqueueOutbox({ id: `qris_${Date.now()}`, table: 'qris_payments', payload: rowPayload })
        setItems((prev) => [
          {
            id: `local_${Date.now()}`,
            user_id: user.id,
            amount: String(rowPayload.amount),
            currency: 'IDR',
            merchant_name: null,
            status: 'pending_offline',
            gateway_ref: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ])
        logAudit('qris.create_payment.offline', 'high')
        setPayload('')
        setAmount('')
        setNote('')
        return
      }

      const { data: created, error: insErr } = await supabase
        .from('qris_payments')
        .insert(rowPayload)
        .select('*')
        .single()
      if (insErr) throw insErr

      const { data: fnData, error: fnErr } = await supabase.functions.invoke('qris/create-payment', {
        body: {
          amount: rowPayload.amount,
          currency: 'IDR',
          merchant_qr_payload: payload,
          note: note || undefined,
          payment_id: created.id,
        },
      })

      if (fnErr) {
        await supabase.from('qris_payments').update({ status: 'failed' }).eq('id', created.id)
        throw fnErr
      }

      await supabase
        .from('qris_payments')
        .update({
          status: fnData?.status ?? 'pending',
          gateway_ref: fnData?.gateway_ref ?? null,
        })
        .eq('id', created.id)

      logAudit('qris.create_payment', 'high')
      await load()
      setPayload('')
      setAmount('')
      setNote('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat pembayaran')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <div className="text-2xl font-semibold">QRIS</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">Scan/paste payload QRIS, lalu inisiasi pembayaran lewat Edge Function.</div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              className={
                mode === 'scan'
                  ? 'rounded-lg bg-slate-800 px-3 py-2 text-sm'
                  : 'rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-900'
              }
              onClick={() => setMode('scan')}
              type="button"
            >
              Scan/Paste QR
            </button>
            <button
              className={
                mode === 'generate'
                  ? 'rounded-lg bg-slate-800 px-3 py-2 text-sm'
                  : 'rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-900'
              }
              onClick={() => setMode('generate')}
              type="button"
            >
              Generate
            </button>
          </div>
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? 'Memuat…' : 'Refresh'}
          </Button>
        </div>

        {mode === 'scan' ? (
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1">
              <div className="text-sm text-slate-700 dark:text-slate-300">Payload QRIS</div>
              <Input value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="000201..." />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="grid gap-1">
                <div className="text-sm text-slate-700 dark:text-slate-300">Nominal (IDR)</div>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="50000" />
              </div>
              <div className="grid gap-1">
                <div className="text-sm text-slate-700 dark:text-slate-300">Catatan</div>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
              </div>
            </div>
            {error ? (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">{error}</div>
            ) : null}
            <Button onClick={createPayment} disabled={busy || !payload || !amount}>
              {busy ? 'Memproses…' : 'Bayar'}
            </Button>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Catatan: Edge Function `qris/create-payment` perlu dibuat di Supabase agar tombol Bayar berfungsi.
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Generate QR untuk ditampilkan ke pembayar (placeholder). Implementasi bergantung gateway QRIS.
          </div>
        )}
      </Card>

      <Card>
        <div className="text-sm font-medium">Riwayat</div>
        <div className="mt-4 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2">Waktu</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-slate-800">
                  <td className="py-2 text-slate-700 dark:text-slate-300">{new Date(it.created_at).toLocaleString('id-ID')}</td>
                  <td className="py-2 text-slate-900 dark:text-slate-200">{it.status}</td>
                  <td className="py-2 text-right tabular-nums">{new Intl.NumberFormat('id-ID').format(Number(it.amount))}</td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Belum ada pembayaran.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
