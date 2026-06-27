import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS.
// Only use server-side after verifying user permissions manually.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    // Fallback to anon key in dev (RLS still applies, editor actions may fail)
    return createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
