'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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

// Called client-side after SDK returns payment_status === 'success'
export async function activateProAfterPayment(
  period: PlanPeriod,
  paymentId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !serviceKey) return { error: 'Конфигурация сервера' }

  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const months    = PRICES[period].months
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)

  const { error: profErr } = await admin.from('profiles').upsert(
    { id: user.id, plan: 'pro', plan_expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() },
    { onConflict: 'id' },
  )
  if (profErr) {
    console.error('[activateProAfterPayment] profile upsert:', profErr)
    return { error: 'Не удалось активировать подписку' }
  }

  await admin.from('subscriptions').insert({
    user_id:     user.id,
    plan:        'pro',
    expires_at:  expiresAt.toISOString(),
    amount_kzt:  PRICES[period].amount,
    source:      'freedompay',
    external_id: paymentId || null,
  })

  console.log(`[activateProAfterPayment] Pro activated for ${user.id} until ${expiresAt.toISOString()}`)
  return { ok: true }
}
