'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getOwnerOrEditorCheck(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: t } = await supabase
    .from('tournaments')
    .select('user_id')
    .eq('id', tournamentId)
    .single()

  if (!t) return null
  if (t.user_id === user.id) return user

  // Check editor access
  const { data: member } = await supabase
    .from('tournament_members')
    .select('role')
    .eq('tournament_id', tournamentId)
    .eq('user_id', user.id)
    .eq('status', 'accepted')
    .eq('role', 'editor')
    .maybeSingle()

  return member ? user : null
}

export async function initLiveGame(
  tournamentId: string,
  homeTeamId: string,
  awayTeamId: string,
  fixtureId?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  if (!await getOwnerOrEditorCheck(supabase, tournamentId)) return { error: 'Нет доступа' }

  const { error } = await supabase.from('live_games').upsert({
    tournament_id: tournamentId,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    home_score: 0,
    away_score: 0,
    period: '1',
    timer_running: false,
    accumulated_secs: 0,
    started_at: null,
    fixture_id: fixtureId ?? null,
  }, { onConflict: 'tournament_id' })

  if (error) return { error: error.message }
  revalidatePath(`/t/${tournamentId}/live`)
  return {}
}

export async function finishLiveMatch(
  tournamentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  if (!await getOwnerOrEditorCheck(supabase, tournamentId)) return { error: 'Нет доступа' }

  const { data: liveGame, error: fetchError } = await supabase
    .from('live_games')
    .select('*')
    .eq('tournament_id', tournamentId)
    .single()

  if (fetchError || !liveGame) return { error: 'Матч не найден' }

  // Save results to fixture if linked (round-robin)
  if (liveGame.fixture_id) {
    const { error } = await supabase.from('fixtures').update({
      home_score: liveGame.home_score,
      away_score: liveGame.away_score,
      played: true,
      status: 'finished',
    }).eq('id', liveGame.fixture_id)

    if (error) return { error: error.message }
  }

  // Save results to playoff_matches if linked
  if (liveGame.playoff_match_id) {
    const hs = liveGame.home_score
    const as_ = liveGame.away_score
    if (hs !== as_) {
      const { data: pm } = await supabase
        .from('playoff_matches')
        .select('*')
        .eq('id', liveGame.playoff_match_id)
        .single()

      if (pm) {
        const winnerId = hs > as_ ? pm.home_team_id : pm.away_team_id
        await supabase.from('playoff_matches').update({
          home_score: hs,
          away_score: as_,
          winner_id: winnerId,
        }).eq('id', liveGame.playoff_match_id)

        if (pm.winner_to_match && winnerId) {
          const field = pm.winner_slot === 'home' ? 'home_team_id' : 'away_team_id'
          await supabase.from('playoff_matches').update({ [field]: winnerId }).eq('id', pm.winner_to_match)
        }
      }
    }
  }

  // Delete live game record
  await supabase.from('live_games').delete().eq('tournament_id', tournamentId)

  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  revalidatePath(`/t/${tournamentId}/live`)
  return {}
}
