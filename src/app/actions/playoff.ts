'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generatePlayoffBracket } from '@/lib/tournament/playoff'

export async function generatePlayoff(tournamentId: string) {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('teams')
    .select('id')
    .eq('tournament_id', tournamentId)
    .order('created_at')

  if (!teams || teams.length < 2) return { error: 'Нужно минимум 2 команды' }

  await supabase.from('playoff_matches').delete().eq('tournament_id', tournamentId)

  const teamIds = teams.map(t => t.id)
  const matches = generatePlayoffBracket(teamIds)

  // First insert without winner_to_match to get IDs
  const toInsert = matches.map(m => ({
    tournament_id: tournamentId,
    round_order: m.round_order,
    match_order: m.match_order,
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
    winner_slot: m.winner_slot,
    _temp_id: m.id,
    _winner_to_match_temp: m.winner_to_match,
  }))

  const { data: inserted, error } = await supabase
    .from('playoff_matches')
    .insert(toInsert.map(({ _temp_id: _t, _winner_to_match_temp: _w, ...rest }) => rest))
    .select('id, round_order, match_order')

  if (error) return { error: error.message }

  // Build lookup: (round_order, match_order) → real id
  const lookup = new Map<string, string>()
  inserted!.forEach(r => lookup.set(`${r.round_order}:${r.match_order}`, r.id))

  // Second pass: link winner_to_match
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    if (m.winner_to_match !== null) {
      const targetKey = `${m.winner_to_match}:${Math.ceil(m.match_order / 2)}`
      const targetId = lookup.get(targetKey)
      const selfId = lookup.get(`${m.round_order}:${m.match_order}`)
      if (targetId && selfId) {
        await supabase.from('playoff_matches').update({ winner_to_match: targetId }).eq('id', selfId)
      }
    }
  }

  await supabase.from('tournaments').update({ generated: true }).eq('id', tournamentId)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}

export async function startPlayoffMatch(
  matchId: string,
  tournamentId: string,
  homeTeamId: string,
  awayTeamId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

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
    fixture_id: null,
    playoff_match_id: matchId,
  }, { onConflict: 'tournament_id' })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return {}
}

export async function savePlayoffResult(
  matchId: string,
  tournamentId: string,
  homeScore: number,
  awayScore: number,
  events: { teamId: string; playerName: string; type?: string; minute?: number }[] = [],
) {
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('playoff_matches')
    .select('*')
    .eq('id', matchId)
    .single()

  if (!match) return { error: 'Матч не найден' }
  if (homeScore === awayScore) return { error: 'В плей-офф ничьей быть не может' }

  const winnerId = homeScore > awayScore ? match.home_team_id : match.away_team_id

  const { error: updateErr } = await supabase.from('playoff_matches').update({
    home_score: homeScore,
    away_score: awayScore,
    winner_id: winnerId,
  }).eq('id', matchId)

  if (updateErr) return { error: updateErr.message }

  // Advance winner to next match if linked
  if (match.winner_to_match && winnerId) {
    const field = match.winner_slot === 'home' ? 'home_team_id' : 'away_team_id'
    await supabase.from('playoff_matches').update({ [field]: winnerId }).eq('id', match.winner_to_match)
  }

  // Replace match events
  await supabase.from('match_events').delete().eq('playoff_match_id', matchId)

  const valid = events.filter(e => e.playerName.trim())
  if (valid.length > 0) {
    await supabase.from('match_events').insert(
      valid.map(e => ({
        playoff_match_id: matchId,
        fixture_id: null,
        team_id: e.teamId,
        player_name: e.playerName.trim(),
        type: e.type ?? 'goal',
        minute: e.minute ?? null,
      }))
    )
  }

  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}
