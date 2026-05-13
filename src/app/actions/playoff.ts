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

export async function savePlayoffResult(
  matchId: string,
  tournamentId: string,
  homeScore: number,
  awayScore: number
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

  await supabase.from('playoff_matches').update({
    home_score: homeScore,
    away_score: awayScore,
    winner_id: winnerId,
  }).eq('id', matchId)

  // Advance winner to next match if linked
  if (match.winner_to_match && winnerId) {
    const field = match.winner_slot === 'home' ? 'home_team_id' : 'away_team_id'
    await supabase.from('playoff_matches').update({ [field]: winnerId }).eq('id', match.winner_to_match)
  }

  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}
