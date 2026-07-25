'use server'

import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Plan = 'free' | 'pro' | 'enterprise'

function resolvePlan(plan: string | null, expiresAt: string | null): Plan {
  if (plan === 'enterprise') return 'enterprise'
  if (plan === 'pro') {
    if (!expiresAt || new Date(expiresAt) > new Date()) return 'pro'
  }
  return 'free'
}

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
  return resolvePlan(data.plan, data.plan_expires_at)
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
  const plan = resolvePlan(data.plan, data.plan_expires_at)
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
  return resolvePlan(data.plan, data.plan_expires_at)
}

// ── Читает план ВЛАДЕЛЬЦА лиги ────────────────────────────────────────────────
export async function getLeagueOwnerPlan(leagueId: string): Promise<Plan> {
  noStore()
  const supabase = await createClient()

  const { data: league } = await supabase
    .from('leagues')
    .select('owner_id')
    .eq('id', leagueId)
    .maybeSingle()

  if (!league) return 'free'

  const { data, error } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', league.owner_id)
    .maybeSingle()

  if (error || !data) return 'free'
  return resolvePlan(data.plan, data.plan_expires_at)
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

// ── Активирует Enterprise (только is_admin) ───────────────────────────────────
export async function activateEnterprise(userId: string): Promise<{ error?: string }> {
  noStore()
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return { error: 'Не авторизован' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', currentUser.id).maybeSingle()
  if (!profile?.is_admin) return { error: 'Недостаточно прав' }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, plan: 'enterprise', plan_expires_at: null, updated_at: new Date().toISOString() }, { onConflict: 'id' })

  if (error) return { error: error.message }
  return {}
}

// ── Отменяет подписку ─────────────────────────────────────────────────────────
// С рекуррентными платежами TipTop Pay: отключает автопродление через API.
// У FreedomPay рекуррента нет — продление ручное, и отменять в шлюзе нечего:
// «отмена» означает «не продлевать». Оплаченный период в любом случае доживает
// до конца, иначе пользователь теряет то, за что уже заплатил.
//
// immediate = true — принудительный перевод на free без учёта оплаченного
// периода. Нужен админскому переключателю планов, обычному пользователю нет.
export async function cancelSubscription(
  immediate = false,
): Promise<{ error?: string; accessUntil?: string | null }> {
  noStore()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Последняя рекуррентная подписка, записанная вебхуком TipTop Pay
  const { data: lastSub } = await supabase
    .from('subscriptions')
    .select('subscription_id')
    .eq('user_id', user.id)
    .eq('source', 'cloudpayments')
    .not('subscription_id', 'is', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastSub?.subscription_id) {
    const publicId  = process.env.NEXT_PUBLIC_TIPTOPPAY_PUBLIC_ID ?? ''
    const apiSecret = process.env.TIPTOPPAY_API_SECRET ?? ''
    if (!publicId || !apiSecret) return { error: 'Платёжный модуль не настроен' }

    try {
      const res = await fetch('https://api.tiptoppay.kz/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(`${publicId}:${apiSecret}`).toString('base64'),
        },
        body: JSON.stringify({ Id: lastSub.subscription_id }),
        cache: 'no-store',
      })
      const json = await res.json().catch(() => null) as { Success?: boolean; Message?: string } | null
      if (!res.ok || !json?.Success) {
        console.error('[cancelSubscription] tiptop cancel failed:', res.status, json)
        return { error: 'Не удалось отключить автопродление. Напишите нам: info@tournable.app' }
      }
    } catch (err) {
      console.error('[cancelSubscription] tiptop cancel error:', err)
      return { error: 'Не удалось связаться с платёжной системой. Попробуйте позже.' }
    }

    // Автопродление отключено; доступ остаётся до конца оплаченного периода
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_expires_at')
      .eq('id', user.id)
      .maybeSingle()

    console.log(`[cancelSubscription] auto-renewal cancelled for ${user.id} (subscription ${lastSub.subscription_id})`)
    return { accessUntil: profile?.plan_expires_at ?? null }
  }

  // Подписки в шлюзе нет: либо оплата разовая через FreedomPay, либо ручная
  // выдача. Если оплаченный период ещё идёт — не трогаем план: продлевать его
  // некому, cron сам переведёт на free по истечении срока.
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_expires_at')
    .eq('id', user.id)
    .maybeSingle()

  const expiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null

  if (!immediate && expiresAt && expiresAt.getTime() > Date.now()) {
    console.log(`[cancelSubscription] ${user.id}: продления не будет, доступ до ${profile!.plan_expires_at}`)
    return { accessUntil: profile!.plan_expires_at }
  }

  // Оплаченного периода не осталось (ручная выдача без срока или срок вышел),
  // либо это админский принудительный сброс — переводим на free сразу.
  const { error } = await supabase
    .from('profiles')
    .update({ plan: 'free', plan_expires_at: null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return {}
}

// ── История платежей текущего пользователя ────────────────────────────────────
export async function getPaymentHistory(): Promise<{
  id: string
  plan: string
  amount_kzt: number | null
  source: string
  started_at: string
  expires_at: string | null
}[]> {
  noStore()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('subscriptions')
    .select('id, plan, amount_kzt, source, started_at, expires_at')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(20)

  return data ?? []
}
