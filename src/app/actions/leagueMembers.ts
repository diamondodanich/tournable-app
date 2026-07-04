'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendInviteEmail } from '@/lib/email'
import { APP_URL } from '@/lib/appUrl'

export type LeagueMemberRow = {
  id: string
  role: 'editor' | 'viewer'
  status: 'pending' | 'accepted'
  invited_email: string | null
  user_id: string | null
}

async function ownsLeague(leagueId: string): Promise<{ ok: boolean; userId: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, userId: null }
  const { data: l } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  return { ok: !!l && l.owner_id === user.id, userId: user.id }
}

export async function getLeagueMembers(leagueId: string): Promise<LeagueMemberRow[]> {
  const { ok } = await ownsLeague(leagueId)
  if (!ok) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('league_members')
    .select('id, role, status, invited_email, user_id')
    .eq('league_id', leagueId)
    .order('created_at')
  return (data ?? []) as LeagueMemberRow[]
}

export async function createLeagueInviteLink(leagueId: string, role: 'editor' | 'viewer'): Promise<{ token?: string; error?: string }> {
  const { ok } = await ownsLeague(leagueId)
  if (!ok) return { error: 'Нет доступа' }
  const supabase = await createClient()
  const token = crypto.randomUUID()
  const { error } = await supabase.from('league_members').insert({
    league_id: leagueId, role, status: 'pending', invite_token: token,
  })
  if (error) return { error: error.message }
  return { token }
}

export async function inviteLeagueByEmail(
  leagueId: string,
  role: 'editor' | 'viewer',
  email: string,
  lang: 'ru' | 'kz' | 'en' = 'ru',
): Promise<{ ok?: true; error?: string }> {
  const { ok } = await ownsLeague(leagueId)
  if (!ok) return { error: 'Нет доступа' }
  const supabase = await createClient()
  const { data: league } = await supabase.from('leagues').select('name').eq('id', leagueId).single()

  const token = crypto.randomUUID()
  const { error } = await supabase.from('league_members').insert({
    league_id: leagueId, role, status: 'pending', invite_token: token, invited_email: email,
  })
  if (error) return { error: error.message }

  await sendInviteEmail(email, league?.name ?? 'Чемпионат', `${APP_URL}/invite/league/${token}`, role, lang)
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return { ok: true }
}

export async function removeLeagueMember(memberId: string, leagueId: string): Promise<void> {
  const { ok } = await ownsLeague(leagueId)
  if (!ok) return
  const supabase = await createClient()
  await supabase.from('league_members').delete().eq('id', memberId)
  revalidatePath(`/dashboard/leagues/${leagueId}`)
}

export async function acceptLeagueInvite(token: string): Promise<{ ok?: true; leagueId?: string; slug?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not_authed' }

  const { data: member } = await supabase
    .from('league_members')
    .select('id, league_id, leagues(slug)')
    .eq('invite_token', token)
    .eq('status', 'pending')
    .single()
  if (!member) return { error: 'invite_not_found' }

  const { error } = await supabase
    .from('league_members')
    .update({ user_id: user.id, status: 'accepted', invited_email: user.email ?? null })
    .eq('id', member.id)
  if (error) return { error: error.message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = (member as any).leagues?.slug as string | undefined
  return { ok: true, leagueId: member.league_id, slug }
}
