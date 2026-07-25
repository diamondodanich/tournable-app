'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PRICES, ENTERPRISE_PRICES, type PlanPeriod, type PlanType } from '@/lib/freedompay'

export type PaymentSource = 'freedompay' | 'cloudpayments'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'unknown'

// Read the viewer's UI language from the `lang` cookie (server-side).
async function getLangFromCookie(): Promise<'ru' | 'kz' | 'en'> {
  const store = await cookies()
  const v = store.get('lang')?.value
  return v === 'kz' || v === 'en' ? v : 'ru'
}

// Создаёт заказ ДО оплаты и возвращает параметры для SDK.
//
// Заказ — единственная связь между платежом и пользователем: webhook находит
// строку по pg_order_id и только он вправе перевести её в 'paid'. Раньше эту
// роль играли custom_params, которые провайдер обязан вернуть обратно, а план
// выдавался клиентским вызовом — то есть вообще без подтверждения оплаты.
export async function getPaymentOrderParams(
  period: PlanPeriod,
  planType: PlanType = 'pro',
  provider: PaymentSource = 'freedompay',
): Promise<{ orderId: string; userId: string; amount: number; description: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/checkout')

  try {
    const prices  = planType === 'enterprise' ? ENTERPRISE_PRICES : PRICES
    const label   = planType === 'enterprise' ? 'Enterprise' : 'Pro'
    const amount  = prices[period].amount
    const orderId = `t_${user.id.replace(/-/g, '').slice(0, 16)}_${Date.now()}`

    const { error } = await supabase.from('payment_orders').insert({
      order_id:   orderId,
      user_id:    user.id,
      plan:       planType,
      period,
      amount_kzt: amount,
      provider,
      lang:       await getLangFromCookie(),
    })

    // Без записанного заказа webhook не сможет опознать платёж, а значит план не
    // активируется. Лучше не пустить к оплате, чем взять деньги вслепую.
    if (error) {
      console.error('[getPaymentOrderParams] order insert:', error)
      return { error: 'Не удалось создать заказ. Попробуйте ещё раз или напишите в поддержку.' }
    }

    return {
      orderId,
      userId:      user.id,
      amount,
      description: `Tournable ${label} — ${period === 'monthly' ? 'Месяц' : 'Год'}`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ошибка формирования платежа'
    console.error('[getPaymentOrderParams]', err)
    return { error: msg }
  }
}

// Статус заказа для поллинга на /checkout/success.
// RLS отдаёт только свои строки, поэтому чужой orderId вернёт 'unknown'.
export async function getPaymentOrderStatus(
  orderId: string,
): Promise<{ status: OrderStatus; plan?: PlanType }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'unknown' }

  const { data, error } = await supabase
    .from('payment_orders')
    .select('status, plan')
    .eq('order_id', orderId)
    .maybeSingle()

  if (error || !data) return { status: 'unknown' }
  return { status: data.status as OrderStatus, plan: data.plan as PlanType }
}
