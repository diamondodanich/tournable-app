'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type LeaderboardEntry = { team_id: string; round: number; points: number }

async function canEdit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: t } = await supabase.from('tournaments').select('user_id').eq('id', tournamentId).single()
  if (!t) return false
  if (t.user_id === user.id) return true
  const { data: m } = await supabase
    .from('tournament_members')
    .select('role')
    .eq('tournament_id', tournamentId)
    .eq('user_id', user.id)
    .eq('status', 'accepted')
    .eq('role', 'editor')
    .maybeSingle()
  return !!m
}

export async function getLeaderboardEntries(tournamentId: string): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('leaderboard_entries')
    .select('team_id, round, points')
    .eq('tournament_id', tournamentId)
  return (data ?? []) as LeaderboardEntry[]
}

export async function upsertLeaderboardEntry(
  tournamentId: string,
  teamId: string,
  round: number,
  points: number,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  if (!(await canEdit(supabase, tournamentId))) return { error: 'Нет доступа' }
  const { error } = await supabase
    .from('leaderboard_entries')
    .upsert({ tournament_id: tournamentId, team_id: teamId, round, points }, { onConflict: 'tournament_id,team_id,round' })
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return {}
}

// Persist the number of rounds/events on the tournament so it survives reloads
// even before any points are entered.
export async function setLeaderboardRounds(tournamentId: string, rounds: number): Promise<{ error?: string }> {
  const supabase = await createClient()
  if (!(await canEdit(supabase, tournamentId))) return { error: 'Нет доступа' }
  const safe = Math.max(1, Math.min(200, Math.floor(rounds)))
  const { error } = await supabase.from('tournaments').update({ num_rounds: safe }).eq('id', tournamentId)
  if (error) return { error: error.message }
  // Drop entries for rounds beyond the new count.
  await supabase.from('leaderboard_entries').delete().eq('tournament_id', tournamentId).gt('round', safe)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return {}
}
