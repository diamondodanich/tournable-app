import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSubscriptionExpiringEmail, sendSubscriptionExpiredEmail } from '@/lib/email'

export const runtime = 'nodejs'

// Runs daily at 06:00 UTC via Vercel Cron (vercel.json)
// 1. Sends 3-day warning emails
// 2. Downgrades expired Pro accounts to free via DB function
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Use service role if available, otherwise anon (RPC function handles auth via SECURITY DEFINER)
  const supabase = createClient(url, serviceKey ?? anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const now = new Date()
  let warned = 0
  let deactivated = 0

  // ── 1. 3-day expiry warning ───────────────────────────────────────────────
  const warningDay = new Date(now)
  warningDay.setDate(warningDay.getDate() + 3)
  warningDay.setHours(0, 0, 0, 0)
  const warningDayEnd = new Date(warningDay)
  warningDayEnd.setHours(23, 59, 59, 999)

  const { data: expiringProfiles } = await supabase
    .from('profiles')
    .select('id, plan_expires_at')
    .eq('plan', 'pro')
    .gte('plan_expires_at', warningDay.toISOString())
    .lte('plan_expires_at', warningDayEnd.toISOString())

  for (const profile of expiringProfiles ?? []) {
    if (!serviceKey) break // email sending needs auth.admin
    const { data: { user } } = await supabase.auth.admin.getUserById(profile.id)
    if (user?.email) {
      await sendSubscriptionExpiringEmail(user.email, new Date(profile.plan_expires_at))
      warned++
    }
  }

  // ── 2. Deactivate expired subscriptions ──────────────────────────────────
  // Uses SECURITY DEFINER RPC so it works without service role key too
  const { data: expiredResult, error: rpcError } = await supabase
    .rpc('deactivate_expired_subscriptions')

  if (rpcError) {
    console.error('[cron] deactivate_expired_subscriptions RPC error:', rpcError.message)
  } else {
    deactivated = (expiredResult as { deactivated: number } | null)?.deactivated ?? 0
  }

  // Send "expired" emails if service key available
  if (serviceKey && deactivated > 0) {
    const { data: justExpired } = await supabase
      .from('profiles')
      .select('id')
      .eq('plan', 'free')
      .lte('updated_at', now.toISOString())
      .gte('updated_at', new Date(now.getTime() - 60_000).toISOString())

    for (const profile of justExpired ?? []) {
      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id)
      if (user?.email) await sendSubscriptionExpiredEmail(user.email)
    }
  }

  return NextResponse.json({ ok: true, warned, deactivated, ts: now.toISOString() })
}
