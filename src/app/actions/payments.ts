'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { buildPaymentFormParams, type PlanPeriod, GATEWAY_URL } from '@/lib/freedompay'

// Returns signed params for client-side form POST.
// FreedomPay's API sits behind Cloudflare and blocks Vercel server IPs,
// so we never call it server-side — the browser POSTs directly instead.
export async function getPaymentFormParams(
  period: PlanPeriod,
): Promise<{ params: Record<string, string>; endpoint: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/checkout')

  try {
    const params = buildPaymentFormParams(user.id, period)
    return { params, endpoint: GATEWAY_URL }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ошибка формирования платежа'
    console.error('[getPaymentFormParams]', err)
    return { error: msg }
  }
}
