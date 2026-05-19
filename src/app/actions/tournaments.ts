'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createTournament(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const format = (formData.get('format') as string) || 'round_robin'
  const num_rounds = format === 'round_robin' ? (parseInt(formData.get('num_rounds') as string) || 2) : 1

  if (!name) return { error: 'Введите название турнира' }

  const { data, error } = await supabase
    .from('tournaments')
    .insert({ user_id: user.id, name, num_rounds, format })
    .select()
    .single()

  if (error) return { error: error.message }

  redirect(`/dashboard/tournament/${data.id}`)
}

export async function deleteTournament(id: string) {
  const supabase = await createClient()
  await supabase.from('tournaments').delete().eq('id', id)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function addTeam(tournamentId: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('teams')
    .insert({ tournament_id: tournamentId, name: name.trim() })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}

export async function renameTournament(tournamentId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Введите название' }
  const { error } = await supabase.from('tournaments').update({ name: trimmed }).eq('id', tournamentId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}

export async function removeTeam(teamId: string, tournamentId: string) {
  const supabase = await createClient()
  await supabase.from('teams').delete().eq('id', teamId)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}

export async function generateSchedule(tournamentId: string) {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('teams')
    .select('id')
    .eq('tournament_id', tournamentId)

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('num_rounds')
    .eq('id', tournamentId)
    .single()

  if (!teams || teams.length < 2) return { error: 'Нужно минимум 2 команды' }

  await supabase.from('fixtures').delete().eq('tournament_id', tournamentId)

  const teamIds = teams.map(t => t.id)
  const baseRounds = generateRoundRobin(teamIds)
  const numRounds = tournament?.num_rounds ?? 2
  const fixtures = []
  let matchdayCounter = 0

  for (let cycle = 0; cycle < numRounds; cycle++) {
    for (let ri = 0; ri < baseRounds.length; ri++) {
      matchdayCounter++
      const round = baseRounds[ri]
      for (const [a, b] of round) {
        let home = a, away = b
        if (cycle % 2 === 1) { home = b; away = a }
        const isBye = home === null || away === null
        fixtures.push({
          tournament_id: tournamentId,
          matchday: matchdayCounter,
          round: cycle + 1,
          cycle_round: ri + 1,
          home_team_id: home,
          away_team_id: away,
          played: false,
          is_bye: isBye,
        })
      }
    }
  }

  const { error } = await supabase.from('fixtures').insert(fixtures)
  if (error) return { error: error.message }

  await supabase.from('tournaments').update({ generated: true }).eq('id', tournamentId)
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
}

export async function startFixture(
  fixtureId: string,
  tournamentId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase
    .from('fixtures')
    .update({ status: 'live' })
    .eq('id', fixtureId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return {}
}

export async function saveFixtureResult(
  fixtureId: string,
  tournamentId: string,
  homeScore: number,
  awayScore: number,
  events: { teamId: string; playerName: string; type?: string; minute?: number }[]
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error: fixtureError } = await supabase.from('fixtures').update({
    home_score: homeScore,
    away_score: awayScore,
    played: true,
    status: 'finished',
  }).eq('id', fixtureId)

  if (fixtureError) return { error: fixtureError.message }

  const { error: deleteError } = await supabase
    .from('match_events').delete().eq('fixture_id', fixtureId)

  if (deleteError) return { error: deleteError.message }

  const valid = events.filter(e => e.playerName.trim())
  if (valid.length > 0) {
    const { error: insertError } = await supabase.from('match_events').insert(
      valid.map(e => ({
        fixture_id: fixtureId,
        team_id: e.teamId,
        player_name: e.playerName.trim(),
        type: e.type ?? 'goal',
        minute: e.minute ?? null,
      }))
    )
    if (insertError) return { error: insertError.message }
  }

  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return {}
}

function generateRoundRobin(teams: (string | null)[]): (string | null)[][] [] {
  const working = [...teams]
  if (working.length % 2 === 1) working.push(null)

  const n = working.length
  const rounds = n - 1
  const half = n / 2
  const result: (string | null)[][][]  = []
  const fixed = working[0]
  let rotating = working.slice(1)

  for (let r = 0; r < rounds; r++) {
    const roundMatches: (string | null)[][] = []
    const arr = [fixed, ...rotating]
    for (let i = 0; i < half; i++) {
      const home = arr[i]
      const away = arr[n - 1 - i]
      if (r % 2 === 1 && i === 0) roundMatches.push([away, home])
      else roundMatches.push([home, away])
    }
    result.push(roundMatches)
    rotating.unshift(rotating.pop()!)
  }
  return result
}
