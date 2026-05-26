'use server'

import { createClient } from '@/lib/supabase/server'

export type Plan = 'free' | 'pro'

// ── Читает план текущего пользователя ────────────────────────────────────────
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

// ── Читает план + admin-статус текущего пользователя ─────────────────────────
export async function getUserPlanAndAdmin(): Promise<{ plan: Plan; isAdmin: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { plan: 'free', isAdmin: false }

  const { data } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!data) return { plan: 'free', isAdmin: false }

  const isAdmin = data.is_admin === true
  let plan: Plan = 'free'
  if (data.plan === 'pro') {
    if (!data.plan_expires_at || new Date(data.plan_expires_at) > new Date()) plan = 'pro'
  }
  return { plan, isAdmin }
}

// ── Читает план ВЛАДЕЛЬЦА турнира ─────────────────────────────────────────────
// Используется в server actions для Live/Fixture — редактор работает
// в рамках плана владельца, а не своего собственного.
export async function getOwnerPlan(tournamentId: string): Promise<Plan> {
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('user_id')
    .eq('id', tournamentId)
    .maybeSingle()

  if (!tournament) return 'free'

  const { data } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', tournament.user_id)
    .maybeSingle()

  if (!data) return 'free'
  if (data.plan === 'pro') {
    if (!data.plan_expires_at || new Date(data.plan_expires_at) > new Date()) return 'pro'
  }
  return 'free'
}

// ── Активирует Pro-тариф для пользователя ─────────────────────────────────────
// Вызывается из webhook-обработчиков платёжных систем (Kaspi, CloudPayments).
// Не экспортируется как публичный server action — только для внутреннего использования.
export async function activatePro(
  userId: string,
  expiresAt: Date | null,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        plan: 'pro',
        plan_expires_at: expiresAt ? expiresAt.toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (error) return { error: error.message }
  return {}
}
