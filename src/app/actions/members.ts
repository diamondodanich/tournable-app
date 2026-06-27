'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendInviteEmail } from '@/lib/email'

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function createInviteLink(tournamentId: string, role: 'editor' | 'viewer') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: t } = await supabase.from('tournaments').select('user_id').eq('id', tournamentId).single()
  if (!t || t.user_id !== user.id) return { error: 'Нет доступа' }

  const token = crypto.randomUUID()
  const { error } = await supabase.from('tournament_members').insert({
    tournament_id: tournamentId,
    role,
    status: 'pending',
    invite_token: token,
  })

  if (error) return { error: error.message }
  return { token }
}

export async function acceptInvite(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/invite/${token}`)

  // Use admin client to read by token (bypasses RLS — token itself is the auth)
  const admin = getAdmin()
  const { data: member } = await admin
    .from('tournament_members')
    .select('*')
    .eq('invite_token', token)
    .eq('status', 'pending')
    .single()

  if (!member) return { error: 'Приглашение недействительно или уже использовано' }

  // Use admin client for UPDATE — RLS may block the invited user from updating the row
  const { error } = await admin.from('tournament_members').update({
    user_id: user!.id,
    status: 'accepted',
  }).eq('id', member.id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/tournament/${member.tournament_id}`)
  redirect(`/dashboard/tournament/${member.tournament_id}`)
}

export async function removeMember(memberId: string, tournamentId: string) {
  const supabase = await createClient()
  await supabase.from('tournament_members').delete().eq('id', memberId)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}

// ── Email invite ──────────────────────────────────────────────────────────────
export async function inviteByEmail(
  tournamentId: string,
  role: 'editor' | 'viewer',
  email: string,
  lang: 'ru' | 'kz' | 'en' = 'ru',
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: t } = await supabase
    .from('tournaments')
    .select('user_id, name')
    .eq('id', tournamentId)
    .single()
  if (!t || t.user_id !== user.id) return { error: 'Нет доступа' }

  const token = crypto.randomUUID()
  const { error } = await supabase.from('tournament_members').insert({
    tournament_id: tournamentId,
    role,
    status: 'pending',
    invite_token: token,
  })
  if (error) return { error: error.message }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tournable.app'
  const inviteUrl = `${appUrl}/invite/${token}`

  await sendInviteEmail(email, t.name, inviteUrl, role, lang)

  return { ok: true }
}
