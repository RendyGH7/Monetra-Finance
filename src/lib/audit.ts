import { supabase } from '@/lib/supabaseClient'

type RiskLevel = 'low' | 'medium' | 'high'

export async function logAudit(action: string, riskLevel: RiskLevel = 'low') {
  try {
    await supabase.from('audit_logs').insert({
      action,
      risk_level: riskLevel,
      user_agent: navigator.userAgent,
    })
  } catch {
    return
  }
}

