'use server'

import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Plan = 'free' | 'pro'

// ── Читает план текущего пользователя ────────────────────────────────────────
export async function getUserPlan(): Promise<Plan> {
  noStore()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'free'

  const { data, error } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return 'free'
  if (data.plan === 'pro') {
    if (!data.plan_expires_at || new Date(data.plan_expires_at) > new Date()) return 'pro'
  }
  return 'free'
}

// ── Читает план + admin-статус текущего пользователя ─────────────────────────
export async function getUserPlanAndAdmin(): Promise<{ plan: Plan; isAdmin: boolean }> {
  noStore()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { plan: 'free', isAdmin: false }

  const { data, error } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return { plan: 'free', isAdmin: false }

  const isAdmin = data.is_admin === true
  let plan: Plan = 'free'
  if (data.plan === 'pro') {
    if (!data.plan_expires_at || new Date(data.plan_expires_at) > new Date()) plan = 'pro'
  }
  return { plan, isAdmin }
}

// ── Читает план ВЛАДЕЛЬЦА турнира ─────────────────────────────────────────────
export async function getOwnerPlan(tournamentId: string): Promise<Plan> {
  noStore()
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('user_id')
    .eq('id', tournamentId)
    .maybeSingle()

  if (!tournament) return 'free'

  const { data, error } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', tournament.user_id)
    .maybeSingle()

  if (error || !data) return 'free'
  if (data.plan === 'pro') {
    if (!data.plan_expires_at || new Date(data.plan_expires_at) > new Date()) return 'pro'
  }
  return 'free'
}

// ── Активирует Pro-тариф для пользователя ─────────────────────────────────────
export async function activatePro(
  userId: string,
  expiresAt: Date | null,
): Promise<{ error?: string }> {
  noStore()
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
