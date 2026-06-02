import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendSubscriptionExpiringEmail,
  sendSubscriptionExpiredEmail,
} from '@/lib/email'

export const runtime = 'nodejs'

// Runs daily via Vercel Cron (see vercel.json)
// 1. Sends 3-day warning to users whose subscription expires in exactly 3 days
// 2. Downgrades users whose subscription has expired to free plan
export async function GET(req: NextRequest) {
  // Validate cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date()

  // ── 1. 3-day expiry warning ───────────────────────────────────────────────
  const warningStart = new Date(now)
  warningStart.setDate(warningStart.getDate() + 3)
  warningStart.setHours(0, 0, 0, 0)

  const warningEnd = new Date(warningStart)
  warningEnd.setHours(23, 59, 59, 999)

  const { data: expiringRows } = await supabase
    .from('subscriptions')
    .select('user_id, expires_at')
    .eq('plan', 'pro')
    .gte('expires_at', warningStart.toISOString())
    .lte('expires_at', warningEnd.toISOString())

  let warned = 0
  for (const row of expiringRows ?? []) {
    const { data: { user } } = await supabase.auth.admin.getUserById(row.user_id)
    if (user?.email) {
      await sendSubscriptionExpiringEmail(user.email, new Date(row.expires_at))
      warned++
    }
  }

  // ── 2. Deactivate expired subscriptions ──────────────────────────────────
  const { data: expiredRows } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('plan', 'pro')
    .lte('expires_at', now.toISOString())

  let deactivated = 0
  for (const row of expiredRows ?? []) {
    // Update user metadata plan to 'free'
    await supabase.auth.admin.updateUserById(row.user_id, {
      app_metadata: { plan: 'free' },
    })

    // Send expired email
    const { data: { user } } = await supabase.auth.admin.getUserById(row.user_id)
    if (user?.email) {
      await sendSubscriptionExpiredEmail(user.email)
      deactivated++
    }
  }

  return NextResponse.json({
    ok: true,
    warned,
    deactivated,
    ts: now.toISOString(),
  })
}
