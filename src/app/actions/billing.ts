'use server'

import { createClient } from '@/lib/supabase/server'

export type Plan = 'free' | 'pro'

// ── Читает план текущего пользователя ────────────────────────────────────────
// Используется как в других server actions, так и напрямую из Server Components.
export async function getUserPlan(): Promise<Plan> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'free'

  const { data } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!data) return 'free'
  if (data.plan === 'pro') {
    if (!data.plan_expires_at || new Date(data.plan_expires_at) > new Date()) return 'pro'
  }
  return 'free'
}
