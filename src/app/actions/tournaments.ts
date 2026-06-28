'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { generatePlayoffBracket } from '@/lib/tournament/playoff'

// ─── Slug generation ──────────────────────────────────────────────────────────
const CYRILLIC: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  ә:'a',ғ:'g',қ:'k',ң:'n',ө:'o',ұ:'u',ү:'u',һ:'h',і:'i',
}

function toSlug(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .split('')
    .map(c => CYRILLIC[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
  return `${base}-${id.slice(0, 6)}`
}

// ─── Plan helpers ─────────────────────────────────────────────────────────────
async function getUserPlan(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<'free' | 'pro' | 'enterprise'> {
  const { data } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .maybeSingle()

  if (!data) return 'free'
  if (data.plan === 'enterprise') return 'enterprise'
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
    sport?: string
  }
): Promise<{ id?: string; teamIds?: string[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // ── Plan enforcement ─────────────────────────────────────────────────────
  const [plan, { count: existingCount }] = await Promise.all([
    getUserPlan(supabase, user.id),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
  ])

  if (plan === 'free' && (existingCount ?? 0) >= 1) {
    return { error: 'PLAN_LIMIT_TOURNAMENTS' }
  }

  const validNames = teamNames.map(n => n.trim()).filter(Boolean)

  if (plan === 'free' && validNames.length > 16) {
    return { error: 'PLAN_LIMIT_TEAMS' }
  }

  // ── Create tournament ────────────────────────────────────────────────────
  const newId = crypto.randomUUID()
  const slug = toSlug(name.trim(), newId)

  const { data: t, error: tErr } = await supabase
    .from('tournaments')
    .insert({
      id: newId,
      user_id: user.id,
      name: name.trim(),
      slug,
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
      sport:               settings?.sport             ?? 'football',
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
  // Each format runs its independent writes in parallel to minimise round-trips.
  if (format === 'round_robin' && teamIds.length >= 2) {
    const fixtures = buildRoundRobinFixtures(t.id, teamIds, numRounds)
    await Promise.all([
      supabase.from('fixtures').insert(fixtures),
      supabase.from('tournaments').update({ generated: true }).eq('id', t.id),
    ])
  }

  if (format === 'league_playoff' && teamIds.length >= 2) {
    // numRounds for league_playoff = number of matchdays (1 to N-1)
    const fixtures = buildLeagueFixtures(t.id, teamIds, numRounds)
    const ta = settings?.teamsAdvance ?? 8
    await Promise.all([
      fixtures.length > 0 ? supabase.from('fixtures').insert(fixtures) : Promise.resolve(),
      fixtures.length > 0 ? supabase.from('tournaments').update({ generated: true }).eq('id', t.id) : Promise.resolve(),
      // Pre-generate placeholder bracket so "Сетка" tab shows position labels immediately
      insertPlaceholderBracket(supabase, t.id, ta),
    ])
  }

  if (format === 'groups_playoff' && teamIds.length >= 2) {
    const groupsCount = settings?.groupsCount ?? 4
    // numRounds for groups_playoff = number of legs (1 or 2)
    const fixtures = buildGroupsFixtures(t.id, teamIds, groupsCount, numRounds)
    const teamsAdvance = settings?.teamsAdvance ?? 2
    await Promise.all([
      fixtures.length > 0 ? supabase.from('fixtures').insert(fixtures) : Promise.resolve(),
      fixtures.length > 0 ? supabase.from('tournaments').update({ generated: true }).eq('id', t.id) : Promise.resolve(),
      // Pre-generate placeholder bracket with null team IDs → shows A1/B2 labels in UI
      insertPlaceholderBracket(supabase, t.id, groupsCount * teamsAdvance),
    ])
  }

  if (format === 'playoff' && teamIds.length >= 2) {
    // Auto-generate fair seeded bracket immediately on creation.
    // Pre-assign UUIDs so winner_to_match links resolve in a SINGLE insert
    // (previously this did insert + N sequential UPDATE round-trips — very slow for big brackets).
    const matches = generatePlayoffBracket(teamIds)
    const ids = matches.map(() => crypto.randomUUID())
    const idByKey = new Map<string, string>()
    matches.forEach((m, i) => idByKey.set(`${m.round_order}:${m.match_order}`, ids[i]))

    const rows = matches.map((m, i) => {
      let winner_to_match: string | null = null
      if (m.winner_to_match !== null) {
        const targetKey = `${m.winner_to_match}:${Math.ceil(m.match_order / 2)}`
        winner_to_match = idByKey.get(targetKey) ?? null
      }
      return {
        id: ids[i],
        tournament_id: t.id,
        round_order: m.round_order,
        match_order: m.match_order,
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        winner_slot: m.winner_slot,
        winner_to_match,
      }
    })

    await Promise.all([
      supabase.from('playoff_matches').insert(rows),
      supabase.from('tournaments').update({ generated: true }).eq('id', t.id),
    ])
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

  // Pre-compute rounds per group so we can iterate ri (round-within-group) first.
  // This puts all groups' round-1 matches in matchday 1, round-2 in matchday 2, etc.
  const groupRounds = groups
    .map(g => (g.length >= 2 ? generateRoundRobin(g) : []))
  const maxRounds = Math.max(...groupRounds.map(r => r.length), 0)

  const fixtures = []
  let matchday = 0
  for (let leg = 0; leg < legs; leg++) {
    for (let ri = 0; ri < maxRounds; ri++) {
      matchday++
      for (let g = 0; g < groups.length; g++) {
        const baseRounds = groupRounds[g]
        if (ri >= baseRounds.length) continue
        for (const [homeId, awayId] of baseRounds[ri]) {
          if (awayId === null) {
            fixtures.push({ tournament_id: tournamentId, matchday, round: g + 1, cycle_round: ri + 1, home_team_id: homeId, away_team_id: null, is_bye: true, played: false })
          } else {
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
  // Pre-assign UUIDs so winner_to_match links resolve in a single insert (no second pass).
  const ids = matches.map(() => crypto.randomUUID())
  const idByKey = new Map<string, string>()
  matches.forEach((m, i) => idByKey.set(`${m.round_order}:${m.match_order}`, ids[i]))

  const rows = matches.map((m, i) => {
    let winner_to_match: string | null = null
    if (m.winner_to_match !== null) {
      const targetKey = `${m.winner_to_match}:${Math.ceil(m.match_order / 2)}`
      winner_to_match = idByKey.get(targetKey) ?? null
    }
    return {
      id: ids[i],
      tournament_id: tournamentId,
      round_order: m.round_order,
      match_order: m.match_order,
      home_team_id: null,
      away_team_id: null,
      winner_slot: m.winner_slot,
      winner_to_match,
    }
  })

  await supabase.from('playoff_matches').insert(rows)
}

// ─── addTeam with plan check ──────────────────────────────────────────────────
export async function deleteTournament(id: string) {
  const supabase = await createClient()
  // Soft delete: set deleted_at so the slot is freed for the free plan limit
  await supabase
    .from('tournaments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// Archive without redirect — used by NewTournamentButton modal to free the free-plan slot
export async function archiveTournament(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase
    .from('tournaments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { ok: true }
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
  initialHomeScore = 0,
  initialAwayScore = 0,
): Promise<{ error?: string }> {
  // Verify identity with user session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Verify user is owner OR accepted editor
  const { data: tournament } = await supabase.from('tournaments').select('user_id').eq('id', tournamentId).single()
  if (!tournament) return { error: 'Турнир не найден' }

  const isOwner = tournament.user_id === user.id
  if (!isOwner) {
    const { data: member } = await supabase
      .from('tournament_members')
      .select('role')
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .eq('role', 'editor')
      .maybeSingle()
    if (!member) return { error: 'Нет доступа' }
  }

  // Live-табло — только для тарифа Про (проверяем план владельца турнира)
  const ownerPlan = await getOwnerPlan(supabase, tournamentId)
  if (ownerPlan !== 'pro') return { error: 'Live-табло доступно только на тарифе Про' }

  // Mark fixture as live
  const { error: fe } = await supabase.from('fixtures').update({ status: 'live' }).eq('id', fixtureId)
  if (fe) return { error: fe.message }

  // Pre-create the live_games record so the board opens immediately
  if (homeTeamId && awayTeamId) {
    await supabase.from('live_games').upsert({
      tournament_id: tournamentId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_score: initialHomeScore,
      away_score: initialAwayScore,
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
