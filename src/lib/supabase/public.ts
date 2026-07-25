import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Anonymous, cookie-free Supabase client for public marketing pages.
 *
 * The regular server client reads `cookies()`, which opts the whole route out of
 * static rendering — every crawler hit would then run a fresh SSR pass. Catalogue
 * and sport pages show only `is_public` rows and never need a session, so they use
 * this client and can be cached / revalidated instead.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
