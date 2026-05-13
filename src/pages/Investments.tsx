import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { enqueueOutbox } from '@/lib/offlineOutbox'
import { logAudit } from '@/lib/audit'

type TradeSide = 'buy' | 'sell'

type Trade = {
  id: string
  user_id: string
  asset_symbol: string
  side: TradeSide
  quantity: string
  price: string
  fee: string
  traded_on: string
  created_at: string
}

export default function Investments() {
  const { user } = useAuth()
  const [items, setItems] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [symbol, setSymbol] = useState('')
  const [side, setSide] = useState<TradeSide>('buy')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [fee, setFee] = useState('0')
  const [tradedOn, setTradedOn] = useState(() => new Date().toISOString().slice(0, 10))

  async function load() {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: qErr } = await supabase
      .from('investment_trades')
      .select('*')
      .order('traded_on', { ascending: false })
      .limit(50)
    if (qErr) {
      setError(qErr.message)
      setItems([])
      setLoading(false)
      return
    }
    setItems((data ?? []) as Trade[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [user])

  async function addTrade() {
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const payload = {
        user_id: user.id,
        asset_symbol: symbol.toUpperCase(),
        side,
        quantity: Number(quantity || 0),
        price: Number(price || 0),
        fee: Number(fee || 0),
        traded_on: tradedOn,
      }

      if (!navigator.onLine) {
        enqueueOutbox({ id: `trade_${Date.now()}`, table: 'investment_trades', payload })
        setItems((prev) => [
          {
            id: `local_${Date.now()}`,
            user_id: user.id,
            asset_symbol: payload.asset_symbol,
            side,
            quantity: String(payload.quantity),
            price: String(payload.price),
            fee: String(payload.fee),
            traded_on: tradedOn,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
        logAudit('investments.trade.create.offline', 'medium')
      } else {
        const { error: insErr } = await supabase.from('investment_trades').insert(payload)
        if (insErr) throw insErr
        logAudit('investments.trade.create', 'low')
        await load()
      }

      setSymbol('')
      setQuantity('')
      setPrice('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan trade')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <div className="text-2xl font-semibold">Investasi</div>
        <div className="text-sm text-slate-400">Catat beli/jual dan ringkas portofolio sederhana.</div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <div className="text-sm font-medium">Catat trade</div>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1">
              <div className="text-sm text-slate-700 dark:text-slate-300">Simbol</div>
              <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="BBCA / BTC" />
            </div>
            <div className="grid gap-1">
              <div className="text-sm text-slate-700 dark:text-slate-300">Side</div>
              <select
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                value={side}
                onChange={(e) => setSide(e.target.value as TradeSide)}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <div className="text-sm text-slate-700 dark:text-slate-300">Qty</div>
                <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="decimal" placeholder="10" />
              </div>
              <div className="grid gap-1">
                <div className="text-sm text-slate-700 dark:text-slate-300">Harga</div>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="1000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <div className="text-sm text-slate-700 dark:text-slate-300">Fee</div>
                <Input value={fee} onChange={(e) => setFee(e.target.value)} inputMode="decimal" />
              </div>
              <div className="grid gap-1">
                <div className="text-sm text-slate-700 dark:text-slate-300">Tanggal</div>
                <Input value={tradedOn} onChange={(e) => setTradedOn(e.target.value)} type="date" />
              </div>
            </div>
            {error ? (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">{error}</div>
            ) : null}
            <Button onClick={addTrade} disabled={busy || !symbol || !quantity || !price}>
              {busy ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Aktivitas</div>
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Memuat…' : 'Refresh'}
            </Button>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Simbol</th>
                  <th className="py-2">Side</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Harga</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-slate-800">
                    <td className="py-2 text-slate-700 dark:text-slate-300">{it.traded_on}</td>
                    <td className="py-2 text-slate-900 dark:text-slate-200">{it.asset_symbol}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-400">{it.side}</td>
                    <td className="py-2 text-right tabular-nums">{it.quantity}</td>
                    <td className="py-2 text-right tabular-nums">{it.price}</td>
                  </tr>
                ))}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada trade.
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
