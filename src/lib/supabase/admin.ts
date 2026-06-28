import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS.
// Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured;
// callers must fall back to the user-session client in that case.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
