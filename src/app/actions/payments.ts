'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createPayment, type PlanPeriod } from '@/lib/freedompay'

export async function initiatePayment(period: PlanPeriod) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/checkout')

  try {
    const { redirectUrl } = await createPayment(user.id, period)
    redirect(redirectUrl)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ошибка платёжного сервиса'
    redirect(`/checkout?error=${encodeURIComponent(msg)}`)
  }
}
