import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { logAudit } from '@/lib/audit'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => (mode === 'login' ? 'Masuk' : 'Daftar'), [mode])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        if (data.session) {
          navigate('/dashboard', { replace: true })
          return
        }
        await new Promise((r) => setTimeout(r, 150))
      }
    }
    run()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return
      if (event === 'SIGNED_IN') navigate('/dashboard', { replace: true })
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [navigate])

  async function onSubmit() {
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        logAudit('auth.login', 'low')
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        logAudit('auth.register', 'low')
      }
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses permintaan')
    } finally {
      setBusy(false)
    }
  }

  async function signInWithGoogle() {
    setBusy(true)
    setError(null)
    try {
      logAudit('auth.oauth.google.start', 'low')
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (oauthErr) throw oauthErr
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal masuk dengan Google')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-6 px-4 py-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-3">
          <div className="text-2xl font-semibold">Monetra</div>
          <div className="text-slate-600 dark:text-slate-400">
            Pencatatan transaksi, anggaran, investasi, dan QRIS dengan kontrol keamanan dan audit.
          </div>
          <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="text-sm font-medium">Keamanan</div>
            <ul className="grid list-disc gap-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
              <li>2FA (MFA) dan manajemen sesi</li>
              <li>Enkripsi in-transit (TLS) dan kontrol akses berbasis peran</li>
              <li>Jejak audit aktivitas kritikal</li>
            </ul>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-md p-6">
          <div className="mb-4 flex items-center gap-2">
            <button
              className={
                mode === 'login'
                  ? 'rounded-lg bg-slate-800 px-3 py-2 text-sm'
                  : 'rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-900'
              }
              onClick={() => setMode('login')}
              type="button"
            >
              Masuk
            </button>
            <button
              className={
                mode === 'register'
                  ? 'rounded-lg bg-slate-800 px-3 py-2 text-sm'
                  : 'rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-900'
              }
              onClick={() => setMode('register')}
              type="button"
            >
              Daftar
            </button>
          </div>

          <div className="text-xl font-semibold">{title}</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Gunakan email dan password.</div>

          <div className="mt-6 grid gap-3">
            <Button variant="secondary" onClick={signInWithGoogle} disabled={busy}>
              Lanjut dengan Google
            </Button>
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <div className="text-xs text-slate-500 dark:text-slate-400">atau</div>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="grid gap-1">
              <div className="text-sm text-slate-700 dark:text-slate-300">Email</div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@domain.com" />
            </div>
            <div className="grid gap-1">
              <div className="text-sm text-slate-700 dark:text-slate-300">Password</div>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
            </div>
            {error ? (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">{error}</div>
            ) : null}
            <Button onClick={onSubmit} disabled={busy || !email || !password}>
              {busy ? 'Memproses…' : title}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
