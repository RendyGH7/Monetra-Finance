import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { AppLoader } from '@/components/ui/AppLoader'
import { supabase } from '@/lib/supabaseClient'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [checkingSession, setCheckingSession] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    if (loading) return
    if (user) return
    let cancelled = false
    setCheckingSession(true)
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return
        setHasSession(Boolean(data.session))
      })
      .finally(() => {
        if (cancelled) return
        setCheckingSession(false)
      })

    return () => {
      cancelled = true
    }
  }, [loading, user])

  if (loading || checkingSession) return <AppLoader />
  if (user || hasSession) return <Outlet />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
