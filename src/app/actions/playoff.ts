'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generatePlayoffBracket, buildDoubleElimRows, isPowerOfTwo } from '@/lib/tournament/playoff'

export async function generatePlayoff(tournamentId: string) {
  const supabase = await createClient()

  const [{ data: teams }, { data: tRow }] = await Promise.all([
    supabase.from('teams').select('id').eq('tournament_id', tournamentId).order('created_at'),
    supabase.from('tournaments').select('format').eq('id', tournamentId).maybeSingle(),
  ])

  if (!teams || teams.length < 2) return { error: 'Нужно минимум 2 команды' }

  const teamIds = teams.map(t => t.id)

  // ── Double elimination ────────────────────────────────────────────────────
  if ((tRow as { format?: string } | null)?.format === 'double_elim') {
    if (!isPowerOfTwo(teamIds.length)) {
      return { error: 'Double Elimination требует 4, 8, 16 или 32 участника' }
    }
    await supabase.from('playoff_matches').delete().eq('tournament_id', tournamentId)
    const rows = buildDoubleElimRows(tournamentId, teamIds)
    const { error } = await supabase.from('playoff_matches').insert(rows)
    if (error) return { error: error.message }
    await supabase.from('tournaments').update({ generated: true }).eq('id', tournamentId)
    revalidatePath(`/dashboard/tournament/${tournamentId}`)
    return
  }

  await supabase.from('playoff_matches').delete().eq('tournament_id', tournamentId)

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

  // Carry the tournament's best-of setting onto the regenerated bracket (migration 025).
  // Best-effort: ignored if the column isn't present yet.
  const { data: tt } = await supabase.from('tournaments').select('playoff_best_of').eq('id', tournamentId).maybeSingle()
  const bo = (tt as { playoff_best_of?: number } | null)?.playoff_best_of ?? 1
  if (bo > 1) await supabase.from('playoff_matches').update({ best_of: bo }).eq('tournament_id', tournamentId)

  // Two-legged aggregate tie (migration 026) — queried separately so that a missing
  // column (before the migration is applied) can never break the best_of carry above.
  const { data: tl } = await supabase.from('tournaments').select('playoff_two_legged').eq('id', tournamentId).maybeSingle()
  const twoLegged = (tl as { playoff_two_legged?: boolean } | null)?.playoff_two_legged ?? false
  if (twoLegged) await supabase.from('playoff_matches').update({ two_legged: true }).eq('tournament_id', tournamentId)

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

  // Live scoreboard is available on all plans (gate removed 2026-07 by product decision)
  // Use existing match scores if already recorded via card edit
  const { data: existingMatch } = await supabase
    .from('playoff_matches')
    .select('home_score, away_score')
    .eq('id', matchId)
    .single()

  const { error } = await supabase.from('live_games').upsert({
    tournament_id: tournamentId,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    home_score: existingMatch?.home_score ?? 0,
    away_score: existingMatch?.away_score ?? 0,
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
  const loserId  = homeScore > awayScore ? match.away_team_id : match.home_team_id

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

  // Double elimination: drop the loser into the losers bracket if linked
  // (loser_to_match / loser_slot exist only after migration 033 — undefined = skip).
  if (match.loser_to_match && loserId) {
    const lField = match.loser_slot === 'home' ? 'home_team_id' : 'away_team_id'
    await supabase.from('playoff_matches').update({ [lField]: loserId }).eq('id', match.loser_to_match)
  }

  // Sync score to live_games if a live game is active for this match
  await supabase
    .from('live_games')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('tournament_id', tournamentId)
    .eq('playoff_match_id', matchId)

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
