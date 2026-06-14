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
