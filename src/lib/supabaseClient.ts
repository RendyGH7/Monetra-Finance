import { createClient } from '@supabase/supabase-js'
import { requiredEnv } from '@/lib/env'

export const supabase = createClient(
  requiredEnv('VITE_SUPABASE_URL'),
  requiredEnv('VITE_SUPABASE_ANON_KEY'),
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
