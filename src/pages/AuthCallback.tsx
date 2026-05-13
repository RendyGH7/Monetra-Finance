import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { AppLoader } from '@/components/ui/AppLoader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const url = new URL(window.location.href)
      const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash)

      const oauthError = url.searchParams.get('error') ?? hashParams.get('error')
      const oauthErrorDesc = url.searchParams.get('error_description') ?? hashParams.get('error_description')
      const code = url.searchParams.get('code') ?? hashParams.get('code')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (oauthError) {
        if (cancelled) return
        setError(oauthErrorDesc ?? oauthError)
        return
      }

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
        navigate('/dashboard', { replace: true })
        return
      }

      for (let i = 0; i < 12; i++) {
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        if (data.session) {
          navigate('/dashboard', { replace: true })
          return
        }
        await new Promise((r) => setTimeout(r, 150))
      }

      if (cancelled) return
      navigate('/login', { replace: true })
    }

    run()
    return () => {
      cancelled = true
    }
  }, [navigate])

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

  return <AppLoader />
}
