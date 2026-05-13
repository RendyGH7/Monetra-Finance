import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { AppLoader } from '@/components/ui/AppLoader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [timeoutReached, setTimeoutReached] = useState(false)

  const callbackError = useMemo(() => {
    const url = new URL(window.location.href)
    const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash)
    const oauthError = url.searchParams.get('error') ?? hashParams.get('error')
    const oauthErrorDesc = url.searchParams.get('error_description') ?? hashParams.get('error_description')
    return oauthError ? oauthErrorDesc ?? oauthError : null
  }, [])

  useEffect(() => {
    let cancelled = false
    let cleanup: (() => void) | null = null

    const run = async () => {
      if (callbackError) {
        if (cancelled) return
        setError(callbackError)
        return
      }

      const url = new URL(window.location.href)
      const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash)
      const code = url.searchParams.get('code') ?? hashParams.get('code')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      const timer = window.setTimeout(() => {
        if (cancelled) return
        setTimeoutReached(true)
      }, 15000)

      if (accessToken && refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (setSessionError) {
          if (cancelled) return
          setError(setSessionError.message)
          return
        }
        if (cancelled) return
        window.clearTimeout(timer)
        url.hash = ''
        window.history.replaceState({}, document.title, url.toString())
        navigate('/dashboard', { replace: true })
        return
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          if (cancelled) return
          setError(exchangeError.message)
          return
        }
        if (cancelled) return
        window.clearTimeout(timer)
        url.searchParams.delete('code')
        window.history.replaceState({}, document.title, url.toString())
        navigate('/dashboard', { replace: true })
        return
      }

      const { data: initial } = await supabase.auth.getSession()
      if (cancelled) return
      if (initial.session) {
        window.clearTimeout(timer)
        navigate('/dashboard', { replace: true })
        return
      }

      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return
        if (event === 'SIGNED_IN' && session) {
          window.clearTimeout(timer)
          navigate('/dashboard', { replace: true })
        }
      })

      cleanup = () => {
        window.clearTimeout(timer)
        sub.subscription.unsubscribe()
      }
    }

    void run()
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [callbackError, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Card className="w-full max-w-md">
          <div className="text-lg font-semibold">Login gagal</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</div>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate('/login', { replace: true })}>
              Kembali ke Login
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (timeoutReached) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Card className="w-full max-w-md">
          <div className="text-lg font-semibold">Menunggu login…</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Jika tidak berpindah otomatis, kembali ke Login lalu coba lagi.
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => navigate('/dashboard', { replace: true })}>Buka Dashboard</Button>
            <Button variant="secondary" onClick={() => navigate('/login', { replace: true })}>
              Kembali ke Login
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return <AppLoader />
}
