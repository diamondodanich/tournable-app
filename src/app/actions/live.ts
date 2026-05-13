'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getOwnerCheck(supabase: Awaited<ReturnType<typeof createClient>>, tournamentId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: t } = await supabase.from('tournaments').select('user_id').eq('id', tournamentId).single()
  if (!t || t.user_id !== user.id) return null
  return user
}

export async function initLiveGame(tournamentId: string, homeTeamId: string, awayTeamId: string) {
  const supabase = await createClient()
  if (!await getOwnerCheck(supabase, tournamentId)) return { error: 'Нет доступа' }

  const { error } = await supabase.from('live_games').upsert({
    tournament_id: tournamentId,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    home_score: 0,
    away_score: 0,
    period: '1st',
    timer_running: false,
    accumulated_secs: 0,
    started_at: null,
  }, { onConflict: 'tournament_id' })

  if (error) return { error: error.message }
  revalidatePath(`/t/${tournamentId}/live`)
}

export async function startTimer(tournamentId: string, accumulated: number) {
  const supabase = await createClient()
  if (!await getOwnerCheck(supabase, tournamentId)) return { error: 'Нет доступа' }

  await supabase.from('live_games').update({
    timer_running: true,
    accumulated_secs: accumulated,
    started_at: new Date().toISOString(),
  }).eq('tournament_id', tournamentId)
}

export async function stopTimer(tournamentId: string, accumulated: number) {
  const supabase = await createClient()
  if (!await getOwnerCheck(supabase, tournamentId)) return { error: 'Нет доступа' }

  await supabase.from('live_games').update({
    timer_running: false,
    accumulated_secs: accumulated,
    started_at: null,
  }).eq('tournament_id', tournamentId)
}

export async function resetTimer(tournamentId: string) {
  const supabase = await createClient()
  if (!await getOwnerCheck(supabase, tournamentId)) return { error: 'Нет доступа' }

  await supabase.from('live_games').update({
    timer_running: false,
    accumulated_secs: 0,
    started_at: null,
  }).eq('tournament_id', tournamentId)
}

export async function updateLiveScore(tournamentId: string, home: number, away: number) {
  const supabase = await createClient()
  if (!await getOwnerCheck(supabase, tournamentId)) return { error: 'Нет доступа' }

  await supabase.from('live_games').update({
    home_score: home,
    away_score: away,
  }).eq('tournament_id', tournamentId)
}

export async function setLivePeriod(tournamentId: string, period: string) {
  const supabase = await createClient()
  if (!await getOwnerCheck(supabase, tournamentId)) return { error: 'Нет доступа' }

  await supabase.from('live_games').update({ period }).eq('tournament_id', tournamentId)
}
