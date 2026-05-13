import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabaseClient'
import { Input } from '@/components/ui/Input'
import { logAudit } from '@/lib/audit'

export default function Account() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)

  const [mfaLoading, setMfaLoading] = useState(true)
  const [verifiedFactors, setVerifiedFactors] = useState<
    { id: string; friendly_name: string | null; factor_type: string }[]
  >([])
  const [enrolling, setEnrolling] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)

  const hasMfa = useMemo(() => verifiedFactors.length > 0, [verifiedFactors.length])

  useEffect(() => {
    supabase.auth.getSession().finally(() => setLoading(false))
  }, [])

  async function loadMfa() {
    setMfaLoading(true)
    setMfaError(null)
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      const toFactor = (f: unknown) => {
        if (!f || typeof f !== 'object') return null
        const obj = f as Record<string, unknown>
        const id = typeof obj.id === 'string' ? obj.id : null
        if (!id) return null
        const friendly_name = typeof obj.friendly_name === 'string' ? obj.friendly_name : null
        const factor_type =
          typeof obj.factor_type === 'string'
            ? obj.factor_type
            : typeof obj.type === 'string'
              ? obj.type
              : 'totp'
        return { id, friendly_name, factor_type }
      }

      const verified = [...(data?.totp ?? []), ...(data?.phone ?? []), ...(data?.webauthn ?? [])]
        .map(toFactor)
        .filter((x): x is { id: string; friendly_name: string | null; factor_type: string } => Boolean(x))
      setVerifiedFactors(verified)
    } catch (e) {
      setMfaError(e instanceof Error ? e.message : 'Gagal memuat MFA')
    } finally {
      setMfaLoading(false)
    }
  }

  useEffect(() => {
    loadMfa()
  }, [user?.id])

  async function startEnrollTotp() {
    setEnrolling(true)
    setMfaError(null)
    setFactorId(null)
    setQrSvg(null)
    setSecret(null)
    setChallengeId(null)
    setVerifyCode('')

    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error) throw error
      setFactorId(data.id)
      setQrSvg(data.totp.qr_code)
      setSecret(data.totp.secret)

      const { data: chData, error: chErr } = await supabase.auth.mfa.challenge({ factorId: data.id })
      if (chErr) throw chErr
      setChallengeId(chData.id)
      logAudit('security.mfa.enroll_started', 'medium')
    } catch (e) {
      setMfaError(e instanceof Error ? e.message : 'Gagal memulai MFA')
      setEnrolling(false)
    }
  }

  async function verifyEnroll() {
    if (!factorId || !challengeId) return
    setMfaError(null)
    try {
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code: verifyCode })
      if (error) throw error
      setEnrolling(false)
      setFactorId(null)
      setQrSvg(null)
      setSecret(null)
      setChallengeId(null)
      setVerifyCode('')
      logAudit('security.mfa.enabled', 'high')
      await loadMfa()
    } catch (e) {
      setMfaError(e instanceof Error ? e.message : 'Kode verifikasi tidak valid')
    }
  }

  async function disableFirstFactor() {
    if (!verifiedFactors.length) return
    setMfaError(null)
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactors[0].id })
      if (error) throw error
      logAudit('security.mfa.disabled', 'high')
      await loadMfa()
    } catch (e) {
      setMfaError(e instanceof Error ? e.message : 'Gagal menonaktifkan MFA')
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <div className="text-2xl font-semibold">Akun & Keamanan</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">Pengaturan dasar akun dan sesi.</div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-medium">Profil</div>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-slate-600 dark:text-slate-400">Email</div>
              <div className="text-slate-900 dark:text-slate-100">{user?.email}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-slate-600 dark:text-slate-400">User ID</div>
              <div className="max-w-[240px] truncate font-mono text-xs text-slate-700 dark:text-slate-300">{user?.id}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-medium">Sesi</div>
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">{loading ? 'Memuat…' : 'Sesi tersimpan di perangkat ini.'}</div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                await signOut()
              }}
            >
              Keluar
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await supabase.auth.signOut({ scope: 'global' })
                logAudit('auth.logout_all', 'high')
              }}
            >
              Keluar Semua
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="text-sm font-medium">2FA (MFA)</div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Aktifkan TOTP (Google Authenticator, Authy, dsb).</div>

        {mfaError ? (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">{mfaError}</div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={loadMfa} disabled={mfaLoading}>
            {mfaLoading ? 'Memuat…' : 'Refresh'}
          </Button>
          {!hasMfa ? (
            <Button onClick={startEnrollTotp} disabled={enrolling}>
              {enrolling ? 'Menyiapkan…' : 'Aktifkan MFA'}
            </Button>
          ) : (
            <Button variant="danger" onClick={disableFirstFactor}>
              Nonaktifkan MFA
            </Button>
          )}
        </div>

        {enrolling && qrSvg ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="text-xs text-slate-600 dark:text-slate-400">Scan QR</div>
              <div
                className="mt-2 overflow-hidden rounded-lg bg-white p-2"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>
            <div className="grid gap-3">
              <div className="text-sm text-slate-600 dark:text-slate-400">Jika QR tidak bisa dipindai, gunakan secret ini:</div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                {secret}
              </div>
              <div className="grid gap-1">
                <div className="text-sm text-slate-700 dark:text-slate-300">Kode verifikasi</div>
                <Input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} inputMode="numeric" placeholder="123456" />
              </div>
              <div className="flex gap-2">
                <Button onClick={verifyEnroll} disabled={!verifyCode}>
                  Enable
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEnrolling(false)
                    setFactorId(null)
                    setQrSvg(null)
                    setSecret(null)
                    setChallengeId(null)
                    setVerifyCode('')
                  }}
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {hasMfa ? (
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">MFA aktif ({verifiedFactors.length} factor).</div>
        ) : (
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">MFA belum aktif.</div>
        )}
      </Card>

      <Card>
        <div className="text-sm font-medium">Audit aktivitas</div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Event penting dicatat ke tabel `audit_logs` (best-effort, tidak memblokir operasi).
        </div>
      </Card>
    </div>
  )
}
