'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { generatePlayoffBracket } from '@/lib/tournament/playoff'

// ─── Plan helpers ─────────────────────────────────────────────────────────────
async function getUserPlan(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .maybeSingle()

  if (!data) return 'free'
  if (data.plan === 'pro') {
    if (!data.plan_expires_at || new Date(data.plan_expires_at) > new Date()) return 'pro'
  }
  return 'free'
}

// Проверяет план ВЛАДЕЛЬЦА турнира (не текущего пользователя — он может быть редактором)
async function getOwnerPlan(supabase: Awaited<ReturnType<typeof createClient>>, tournamentId: string) {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('user_id')
    .eq('id', tournamentId)
    .maybeSingle()

  if (!tournament) return 'free'
  return getUserPlan(supabase, tournament.user_id)
}

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

export async function createTournamentWithSetup(
  name: string,
  format: 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff',
  numRounds: number,
  teamNames: string[],
  settings?: {
    matchPeriods?: number
    extraTime?: boolean
    matchDurationMins?: number
    pointsWin?: number
    pointsDraw?: number
    pointsLoss?: number
    groupsCount?: number
    teamsAdvance?: number
  }
): Promise<{ id?: string; teamIds?: string[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // ── Plan enforcement ─────────────────────────────────────────────────────
  const [plan, { count: existingCount }] = await Promise.all([
    getUserPlan(supabase, user.id),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  if (plan === 'free' && (existingCount ?? 0) >= 3) {
    return { error: 'PLAN_LIMIT_TOURNAMENTS' }
  }

  const validNames = teamNames.map(n => n.trim()).filter(Boolean)

  if (plan === 'free' && validNames.length > 16) {
    return { error: 'PLAN_LIMIT_TEAMS' }
  }

  // ── Create tournament ────────────────────────────────────────────────────
  const { data: t, error: tErr } = await supabase
    .from('tournaments')
    .insert({
      user_id: user.id,
      name: name.trim(),
      num_rounds: numRounds,
      format,
      match_periods:       settings?.matchPeriods      ?? 2,
      extra_time:          settings?.extraTime         ?? false,
      match_duration_mins: settings?.matchDurationMins ?? 45,
      points_win:          settings?.pointsWin         ?? 3,
      points_draw:         settings?.pointsDraw        ?? 1,
      points_loss:         settings?.pointsLoss        ?? 0,
      groups_count:        settings?.groupsCount       ?? 4,
      teams_advance:       settings?.teamsAdvance      ?? 2,
    })
    .select()
    .single()
  if (tErr || !t) return { error: tErr?.message ?? 'Ошибка создания' }

  // ── Insert teams ─────────────────────────────────────────────────────────
  let teamIds: string[] = []
  if (validNames.length >= 2) {
    const groupsCount = settings?.groupsCount ?? 4
    const teamsWithGroups = validNames.map((name, i) => {
      let group_name: string | null = null
      if (format === 'groups_playoff') {
        // Serpentine seeding: pot 1 → A,B,C,D; pot 2 → D,C,B,A etc.
        const pot = Math.floor(i / groupsCount)
        const posInPot = i % groupsCount
        const groupIdx = pot % 2 === 0 ? posInPot : (groupsCount - 1 - posInPot)
        group_name = String.fromCharCode(65 + groupIdx) // A, B, C, D...
      }
      return { tournament_id: t.id, name, group_name }
    })
    const { data: insertedTeams, error: teamsErr } = await supabase
      .from('teams').insert(teamsWithGroups).select('id, group_name')
    if (teamsErr) return { error: teamsErr.message }
    teamIds = (insertedTeams ?? []).map((r: { id: string }) => r.id)
  }

  // ── Generate schedule ────────────────────────────────────────────────────
  if (format === 'round_robin' && teamIds.length >= 2) {
    const fixtures = buildRoundRobinFixtures(t.id, teamIds, numRounds)
    await supabase.from('fixtures').insert(fixtures)
    await supabase.from('tournaments').update({ generated: true }).eq('id', t.id)
  }

  if (format === 'league_playoff' && teamIds.length >= 2) {
    // numRounds for league_playoff = number of matchdays (1 to N-1)
    const fixtures = buildLeagueFixtures(t.id, teamIds, numRounds)
    if (fixtures.length > 0) {
      await supabase.from('fixtures').insert(fixtures)
      await supabase.from('tournaments').update({ generated: true }).eq('id', t.id)
    }
    // Pre-generate placeholder bracket so "Сетка" tab shows position labels immediately
    const ta = settings?.teamsAdvance ?? 8
    await insertPlaceholderBracket(supabase, t.id, ta)
  }

  if (format === 'groups_playoff' && teamIds.length >= 2) {
    const groupsCount = settings?.groupsCount ?? 4
    // numRounds for groups_playoff = number of legs (1 or 2)
    const fixtures = buildGroupsFixtures(t.id, teamIds, groupsCount, numRounds)
    if (fixtures.length > 0) {
      await supabase.from('fixtures').insert(fixtures)
      await supabase.from('tournaments').update({ generated: true }).eq('id', t.id)
    }
    // Pre-generate placeholder bracket with null team IDs → shows A1/B2 labels in UI
    const teamsAdvance = settings?.teamsAdvance ?? 2
    await insertPlaceholderBracket(supabase, t.id, groupsCount * teamsAdvance)
  }

  if (format === 'playoff' && teamIds.length >= 2) {
    // Auto-generate fair seeded bracket immediately on creation
    const matches = generatePlayoffBracket(teamIds)

    // Insert without winner_to_match first (need real UUIDs for cross-linking)
    const { data: inserted } = await supabase
      .from('playoff_matches')
      .insert(matches.map(m => ({
        tournament_id: t.id,
        round_order: m.round_order,
        match_order: m.match_order,
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        winner_slot: m.winner_slot,
      })))
      .select('id, round_order, match_order')

    if (inserted) {
      // Build (round_order:match_order) → real UUID lookup
      const lookup = new Map<string, string>()
      inserted.forEach((r: { id: string; round_order: number; match_order: number }) =>
        lookup.set(`${r.round_order}:${r.match_order}`, r.id)
      )

      // Second pass: wire up winner_to_match with real IDs
      for (const m of matches) {
        if (m.winner_to_match !== null) {
          const targetKey = `${m.winner_to_match}:${Math.ceil(m.match_order / 2)}`
          const targetId = lookup.get(targetKey)
          const selfId   = lookup.get(`${m.round_order}:${m.match_order}`)
          if (targetId && selfId) {
            await supabase.from('playoff_matches').update({ winner_to_match: targetId }).eq('id', selfId)
          }
        }
      }
    }

    await supabase.from('tournaments').update({ generated: true }).eq('id', t.id)
  }

  revalidatePath('/dashboard')
  return { id: t.id, teamIds }
}

function buildRoundRobinFixtures(
  tournamentId: string,
  teamIds: string[],
  numRounds: number,
) {
  const baseRounds = generateRoundRobin(teamIds)
  const fixtures = []
  let matchday = 0
  for (let cycle = 0; cycle < numRounds; cycle++) {
    for (let ri = 0; ri < baseRounds.length; ri++) {
      matchday++
      for (const [homeId, awayId] of baseRounds[ri]) {
        if (awayId === null) {
          fixtures.push({ tournament_id: tournamentId, matchday, round: cycle + 1, cycle_round: ri + 1, home_team_id: homeId, away_team_id: null, is_bye: true, played: false })
        } else {
          const [h, a] = cycle % 2 === 0 ? [homeId, awayId] : [awayId, homeId]
          fixtures.push({ tournament_id: tournamentId, matchday, round: cycle + 1, cycle_round: ri + 1, home_team_id: h, away_team_id: a, is_bye: false, played: false })
        }
      }
    }
  }
  return fixtures
}

function buildGroupsFixtures(
  tournamentId: string,
  teamIds: string[],
  groupsCount: number,
  legs: number = 1,   // 1 = single round-robin in each group; 2 = home & away
) {
  // Serpentine (snake) seeding: pot 1 → A,B,C,D; pot 2 → D,C,B,A; pot 3 → A,B,C,D …
  // This ensures balanced strength distribution (top team + bottom team in same group).
  const groups: string[][] = Array.from({ length: groupsCount }, () => [])
  teamIds.forEach((id, i) => {
    const pot = Math.floor(i / groupsCount)
    const posInPot = i % groupsCount
    const groupIdx = pot % 2 === 0 ? posInPot : (groupsCount - 1 - posInPot)
    groups[groupIdx].push(id)
  })

  const fixtures = []
  let matchday = 0
  for (let g = 0; g < groups.length; g++) {
    const groupTeams = groups[g]
    if (groupTeams.length < 2) continue
    const baseRounds = generateRoundRobin(groupTeams)
    for (let leg = 0; leg < legs; leg++) {
      for (let ri = 0; ri < baseRounds.length; ri++) {
        matchday++
        for (const [homeId, awayId] of baseRounds[ri]) {
          if (awayId === null) {
            fixtures.push({ tournament_id: tournamentId, matchday, round: g + 1, cycle_round: ri + 1, home_team_id: homeId, away_team_id: null, is_bye: true, played: false })
          } else {
            // Flip home/away for second leg
            const [h, a] = leg % 2 === 0 ? [homeId, awayId] : [awayId, homeId]
            fixtures.push({ tournament_id: tournamentId, matchday, round: g + 1, cycle_round: ri + 1, home_team_id: h, away_team_id: a, is_bye: false, played: false })
          }
        }
      }
    }
  }
  return fixtures
}

// League fixtures: generates a partial round-robin of exactly `numMatchdays` matchdays.
// numMatchdays = 1..N-1 (N = number of teams). If numMatchdays >= N-1, all matchdays are included.
function buildLeagueFixtures(
  tournamentId: string,
  teamIds: string[],
  numMatchdays: number,
) {
  const allFixtures = buildRoundRobinFixtures(tournamentId, teamIds, 1)  // 1 full circle
  return allFixtures.filter(f => f.matchday <= Math.max(1, numMatchdays))
}

// Insert a fully-null placeholder bracket into playoff_matches.
// Used by groups_playoff and league_playoff so the "Сетка" tab shows position labels
// before the actual knockout stage begins.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertPlaceholderBracket(supabase: any, tournamentId: string, totalSeeds: number) {
  if (totalSeeds < 2) return
  const matches = generatePlayoffBracket(Array(totalSeeds).fill(''))
  const { data: inserted } = await supabase
    .from('playoff_matches')
    .insert(matches.map(m => ({
      tournament_id: tournamentId,
      round_order: m.round_order,
      match_order: m.match_order,
      home_team_id: null,
      away_team_id: null,
      winner_slot: m.winner_slot,
    })))
    .select('id, round_order, match_order')

  if (inserted) {
    const lookup = new Map<string, string>()
    inserted.forEach((r: { id: string; round_order: number; match_order: number }) =>
      lookup.set(`${r.round_order}:${r.match_order}`, r.id)
    )
    for (const m of matches) {
      if (m.winner_to_match !== null) {
        const targetKey = `${m.winner_to_match}:${Math.ceil(m.match_order / 2)}`
        const targetId = lookup.get(targetKey)
        const selfId   = lookup.get(`${m.round_order}:${m.match_order}`)
        if (targetId && selfId) {
          await supabase.from('playoff_matches').update({ winner_to_match: targetId }).eq('id', selfId)
        }
      }
    }
  }
}

// ─── addTeam with plan check ──────────────────────────────────────────────────
export async function deleteTournament(id: string) {
  const supabase = await createClient()
  await supabase.from('tournaments').delete().eq('id', id)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function addTeam(tournamentId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Plan check: free users limited to 16 teams per tournament
  const [plan, { count: teamCount }] = await Promise.all([
    getUserPlan(supabase, user.id),
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('tournament_id', tournamentId),
  ])

  if (plan === 'free' && (teamCount ?? 0) >= 16) {
    return { error: 'PLAN_LIMIT_TEAMS' }
  }

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

export async function updateTournamentSettings(
  tournamentId: string,
  settings: {
    match_periods: number
    extra_time: boolean
    match_duration_mins: number
    points_win: number
    points_draw: number
    points_loss: number
  }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase
    .from('tournaments')
    .update(settings)
    .eq('id', tournamentId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/tournament/${tournamentId}`)
  return {}
}

export async function startFixture(
  fixtureId: string,
  tournamentId: string,
  homeTeamId?: string,
  awayTeamId?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Live-табло — только для тарифа Про (проверяем план владельца турнира)
  const ownerPlan = await getOwnerPlan(supabase, tournamentId)
  if (ownerPlan !== 'pro') return { error: 'Live-табло доступно только на тарифе Про' }

  // Mark fixture as live
  const { error: fe } = await supabase
    .from('fixtures')
    .update({ status: 'live' })
    .eq('id', fixtureId)
  if (fe) return { error: fe.message }

  // Pre-create the live_games record so the board opens immediately
  if (homeTeamId && awayTeamId) {
    await supabase.from('live_games').upsert({
      tournament_id: tournamentId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_score: 0,
      away_score: 0,
      period: '1',
      timer_running: false,
      accumulated_secs: 0,
      started_at: null,
      fixture_id: fixtureId,
    }, { onConflict: 'tournament_id' })
  }

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

  // Sync score to live_games if a live game is active for this fixture
  await supabase
    .from('live_games')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('tournament_id', tournamentId)
    .eq('fixture_id', fixtureId)

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
