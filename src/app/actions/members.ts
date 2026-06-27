'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendInviteEmail } from '@/lib/email'

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

export async function acceptInvite(token: string): Promise<{ ok?: true; tournamentId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not_authed' }

  // SELECT with user session (RLS allows pending invites to be read by token)
  const { data: member } = await supabase
    .from('tournament_members')
    .select('id, tournament_id')
    .eq('invite_token', token)
    .eq('status', 'pending')
    .single()

  if (!member) return { error: 'Приглашение недействительно или уже использовано' }

  // UPDATE with admin client to bypass RLS
  const admin = getAdmin()
  const { error } = await admin
    .from('tournament_members')
    .update({ user_id: user.id, status: 'accepted' })
    .eq('id', member.id)

  if (error) {
    console.error('[acceptInvite] update error:', error.code, error.message)
    return { error: `update_failed: ${error.code} ${error.message}` }
  }

  revalidatePath(`/dashboard/tournament/${member.tournament_id}`)
  return { ok: true, tournamentId: member.tournament_id }
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
