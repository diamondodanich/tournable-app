'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Проверяет план ВЛАДЕЛЬЦА турнира
async function getOwnerPlan(supabase: Awaited<ReturnType<typeof createClient>>, tournamentId: string): Promise<'free' | 'pro'> {
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
  fixtureId?: string | null,
  playoffMatchId?: string | null,
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  const supabase = await createClient()
  if (!await getOwnerOrEditorCheck(supabase, tournamentId)) return { error: 'Нет доступа' }

  // Live-табло — только для тарифа Про (проверяем план владельца турнира)
  const ownerPlan = await getOwnerPlan(supabase, tournamentId)
  if (ownerPlan !== 'pro') return { error: 'Live-табло доступно только на тарифе Про' }

  // Use admin client — editors can't upsert live_games directly due to RLS
  const admin = createAdminClient()
  const { data, error } = await admin.from('live_games').upsert({
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
    playoff_match_id: playoffMatchId ?? null,
  }, { onConflict: 'tournament_id' }).select().single()

  if (error) return { error: error.message }
  revalidatePath(`/t/${tournamentId}/live`)
  return { data: data as Record<string, unknown> }
}

export async function finishLiveMatch(
  tournamentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  if (!await getOwnerOrEditorCheck(supabase, tournamentId)) return { error: 'Нет доступа' }

  const admin = createAdminClient()

  const { data: liveGame, error: fetchError } = await admin
    .from('live_games')
    .select('*')
    .eq('tournament_id', tournamentId)
    .single()

  if (fetchError || !liveGame) return { error: 'Матч не найден' }

  // Save results to fixture if linked (round-robin)
  if (liveGame.fixture_id) {
    const { error } = await admin.from('fixtures').update({
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
      const { data: pm } = await admin
        .from('playoff_matches')
        .select('*')
        .eq('id', liveGame.playoff_match_id)
        .single()

      if (pm) {
        const winnerId = hs > as_ ? pm.home_team_id : pm.away_team_id
        await admin.from('playoff_matches').update({
          home_score: hs,
          away_score: as_,
          winner_id: winnerId,
        }).eq('id', liveGame.playoff_match_id)

        if (pm.winner_to_match && winnerId) {
          const field = pm.winner_slot === 'home' ? 'home_team_id' : 'away_team_id'
          await admin.from('playoff_matches').update({ [field]: winnerId }).eq('id', pm.winner_to_match)
        }
      }
    }
  }

  // Delete live game record
  await admin.from('live_games').delete().eq('tournament_id', tournamentId)

  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  revalidatePath(`/t/${tournamentId}/live`)
  return {}
}
