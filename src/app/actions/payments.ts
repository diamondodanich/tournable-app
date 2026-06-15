'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PRICES, type PlanPeriod } from '@/lib/freedompay'

export async function getPaymentOrderParams(
  period: PlanPeriod,
): Promise<{ orderId: string; userId: string; amount: number; description: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/checkout')

  try {
    const orderId = `t_${user.id.replace(/-/g, '').slice(0, 16)}_${Date.now()}`
    return {
      orderId,
      userId:      user.id,
      amount:      PRICES[period].amount,
      description: `Tournable Pro — ${period === 'monthly' ? 'Месяц' : 'Год'}`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ошибка формирования платежа'
    console.error('[getPaymentOrderParams]', err)
    return { error: msg }
  }
}

// Called client-side after SDK returns payment_status === 'success'.
// Uses user session — profiles RLS allows owner to update their own row.
export async function activateProAfterPayment(
  period: PlanPeriod,
  paymentId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const months    = PRICES[period].months
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)

  const { error: profErr } = await supabase.from('profiles').upsert(
    { id: user.id, plan: 'pro', plan_expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() },
    { onConflict: 'id' },
  )
  if (profErr) {
    console.error('[activateProAfterPayment] profile upsert:', profErr)
    return { error: profErr.message }
  }

  // Best-effort payment record; may fail if RLS/constraints block it
  await supabase.rpc('record_freedompay_subscription', {
    p_user_id:    user.id,
    p_plan:       'pro',
    p_expires_at: expiresAt.toISOString(),
    p_amount_kzt: PRICES[period].amount,
    p_payment_id: paymentId || null,
  }).then(({ error }) => {
    if (error) console.warn('[activateProAfterPayment] subscription record skipped:', error.message)
  })

  console.log(`[activateProAfterPayment] Pro activated for ${user.id} until ${expiresAt.toISOString()}`)
  return { ok: true }
}
