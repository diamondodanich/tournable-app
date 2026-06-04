'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createPayment, type PlanPeriod } from '@/lib/freedompay'

export async function initiatePayment(period: PlanPeriod): Promise<{ error: string } | never> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/checkout')

  // Keep redirect() OUTSIDE try/catch — Next.js redirect throws internally
  // and must not be caught, otherwise navigation is silently swallowed.
  let redirectUrl: string
  try {
    const result = await createPayment(user.id, period)
    redirectUrl = result.redirectUrl
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ошибка платёжного сервиса'
    console.error('[initiatePayment]', err)
    return { error: msg }
  }

  redirect(redirectUrl)
}
