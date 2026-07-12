'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createTournamentWithSetup } from './tournaments'
import { seasonName as computeSeasonName, type SeasonPeriod } from '@/lib/seasons'

// ─── Slug generation (same transliteration as tournaments) ────────────────────
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

function teamSlug(name: string): string {
  return name
    .toLowerCase()
    .split('')
    .map(c => CYRILLIC[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function requireEnterprise() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован', supabase: null, userId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.plan !== 'enterprise') return { error: 'Требуется Enterprise', supabase: null, userId: null }
  return { error: null, supabase, userId: user.id }
}

// ── League CRUD ───────────────────────────────────────────────────────────────

export async function createLeague(formData: FormData): Promise<{ error?: string }> {
  const { error: authErr, supabase, userId } = await requireEnterprise()
  if (authErr || !supabase || !userId) return { error: authErr ?? 'Ошибка авторизации' }

  const name = (formData.get('name') as string ?? '').trim()
  const sport = (formData.get('sport') as string ?? '') || null
  const city = (formData.get('city') as string ?? '').trim() || null
  const description = (formData.get('description') as string ?? '').trim() || null

  if (!name) return { error: 'Введите название лиги' }

  const id = crypto.randomUUID()
  const slug = toSlug(name, id)

  const { error } = await supabase.from('leagues').insert({
    id,
    owner_id: userId,
    name,
    slug,
    sport,
    city,
    description,
    is_public: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/leagues')
  redirect(`/dashboard/leagues/${id}`)
}

export async function updateLeague(
  leagueId: string,
  data: { name?: string; sport?: string | null; city?: string | null; description?: string | null; is_public?: boolean; meta_title?: string | null; meta_description?: string | null }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase
    .from('leagues')
    .update(data)
    .eq('id', leagueId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

// Calendar feature toggle. Best-effort — silently no-ops if the calendar_enabled
// column isn't present yet (migration 030 not applied).
export async function setCalendarEnabled(leagueId: string, enabled: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return
  await supabase.from('leagues').update({ calendar_enabled: enabled }).eq('id', leagueId)
  revalidatePath(`/dashboard/leagues/${leagueId}`)
}

export async function deleteLeague(leagueId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('leagues').delete().eq('id', leagueId).eq('owner_id', user.id)
  revalidatePath('/dashboard/leagues')
  redirect('/dashboard/leagues')
}

// ── Seasons ───────────────────────────────────────────────────────────────────

export async function addSeason(
  leagueId: string,
  name: string,
  tournamentId: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  const { error } = await supabase.from('seasons').insert({
    league_id: leagueId,
    tournament_id: tournamentId || null,
    name: name.trim(),
    status: 'active',
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

export async function updateSeason(
  seasonId: string,
  leagueId: string,
  data: { name?: string; status?: 'active' | 'finished'; tournament_id?: string | null; start_date?: string | null; end_date?: string | null }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  const { error } = await supabase.from('seasons').update(data).eq('id', seasonId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

export async function removeSeason(seasonId: string, leagueId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  await supabase.from('seasons').delete().eq('id', seasonId)
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

// ── League teams ──────────────────────────────────────────────────────────────

export async function addLeagueTeam(
  leagueId: string,
  name: string,
  city?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  const slug = teamSlug(name) || name.slice(0, 20).toLowerCase()

  const { error } = await supabase.from('league_teams').insert({
    league_id: leagueId,
    name: name.trim(),
    slug,
    city: city?.trim() || null,
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

export async function removeLeagueTeam(teamId: string, leagueId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  await supabase.from('league_teams').delete().eq('id', teamId)
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

// ── Squad (formation editor) ──────────────────────────────────────────────────
// Reads / replaces a championship team's whole roster in one shot — used by the
// simulator-style formation editor opened from the standings table.
export type SquadPlayer = { name: string; number: number | null; position: string; photo_url: string | null }

export async function getSquad(leagueTeamId: string): Promise<SquadPlayer[]> {
  const supabase = await createClient()
  // select('*') so photo_url is optional (works before migration 028 is applied).
  const { data } = await supabase
    .from('players')
    .select('*')
    .eq('league_team_id', leagueTeamId)
    .order('number', { nullsFirst: false })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((p: any) => ({
    name: p.name, number: p.number ?? null, position: p.position ?? 'other', photo_url: p.photo_url ?? null,
  }))
}

// Replaces the whole roster. Existing photo_urls are preserved (passed back in),
// and the inserted rows are returned so the client can attach freshly-picked photos.
export async function saveSquad(
  leagueTeamId: string,
  leagueId: string,
  players: { name: string; number: number | null; position: string; photo_url?: string | null }[],
): Promise<{ error?: string; inserted?: { id: string; name: string; number: number | null }[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  await supabase.from('players').delete().eq('league_team_id', leagueTeamId)

  const rows = players
    .filter(p => p.name.trim())
    .map(p => ({
      league_team_id: leagueTeamId,
      name: p.name.trim(),
      number: p.number ?? null,
      position: p.position || 'other',
      photo_url: p.photo_url ?? null,
    }))

  let inserted: { id: string; name: string; number: number | null }[] = []
  if (rows.length > 0) {
    let res = await supabase.from('players').insert(rows).select('id, name, number')
    if (res.error) {
      // Retry without photo_url — column may not exist yet (migration 028 not applied).
      const bare = rows.map(r => ({ league_team_id: r.league_team_id, name: r.name, number: r.number, position: r.position }))
      res = await supabase.from('players').insert(bare).select('id, name, number')
    }
    if (res.error) return { error: res.error.message }
    inserted = (res.data ?? []) as { id: string; name: string; number: number | null }[]
  }

  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return { inserted }
}

// ── Players ───────────────────────────────────────────────────────────────────

export async function addPlayer(
  leagueTeamId: string,
  leagueId: string,
  data: { name: string; number?: number | null; position?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  const { error } = await supabase.from('players').insert({
    league_team_id: leagueTeamId,
    name: data.name.trim(),
    number: data.number ?? null,
    position: data.position ?? 'other',
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

export async function removePlayer(playerId: string, leagueId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: league } = await supabase.from('leagues').select('owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== user.id) return { error: 'Нет доступа' }

  await supabase.from('players').delete().eq('id', playerId)
  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
}

// ── Championship creation (championship + first season in one wizard) ──────────
// Reuses the tournament wizard engine: creates a league (championship), then a
// tournament (first season) with the full schedule, links persistent teams, and
// records the season. Enterprise-only.
type ChampSettings = {
  matchPeriods?: number
  extraTime?: boolean
  matchDurationMins?: number
  pointsWin?: number
  pointsDraw?: number
  pointsLoss?: number
  groupsCount?: number
  teamsAdvance?: number
  sport?: string
  playoffBestOf?: number
  playoffTwoLegged?: boolean
  seasonPeriod?: string
}

export async function createChampionshipWithSetup(
  name: string,
  format: 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff' | 'swiss' | 'leaderboard' | 'double_elim',
  numRounds: number,
  teamNames: string[],
  seasonName: string,
  settings?: ChampSettings,
): Promise<{ leagueId?: string; tournamentId?: string; teamIds?: string[]; error?: string }> {
  const { error: authErr, supabase, userId } = await requireEnterprise()
  if (authErr || !supabase || !userId) return { error: authErr ?? 'Требуется Enterprise' }

  const validNames = teamNames.map(n => n.trim()).filter(Boolean)

  // 1. Create the championship (league)
  const leagueId = crypto.randomUUID()
  const leagueSlug = toSlug(name.trim(), leagueId)
  const { error: lErr } = await supabase.from('leagues').insert({
    id: leagueId,
    owner_id: userId,
    name: name.trim(),
    slug: leagueSlug,
    sport: settings?.sport ?? null,
    is_public: true,
  })
  if (lErr) return { error: lErr.message }

  // Store season periodicity (migration 027) — best-effort so an unapplied migration
  // doesn't break championship creation.
  if (settings?.seasonPeriod) {
    await supabase.from('leagues').update({ season_period: settings.seasonPeriod }).eq('id', leagueId)
  }

  // 2. Create the first season as a full tournament (reuse wizard engine)
  const t = await createTournamentWithSetup(name, format, numRounds, teamNames, settings)
  if (t.error || !t.id) {
    await supabase.from('leagues').delete().eq('id', leagueId) // rollback
    return { error: t.error ?? 'Ошибка создания сезона' }
  }

  // 3. Create persistent championship teams + link tournament teams (same order)
  const tournamentTeamIds = t.teamIds ?? []
  if (validNames.length > 0) {
    const ltRows = validNames.map(n => ({
      league_id: leagueId,
      name: n,
      slug: teamSlug(n) || n.slice(0, 20).toLowerCase(),
    }))
    const { data: insertedLT } = await supabase.from('league_teams').insert(ltRows).select('id')
    const ltIds = (insertedLT ?? []).map((r: { id: string }) => r.id)
    await Promise.all(
      tournamentTeamIds.map((tid, i) =>
        ltIds[i]
          ? supabase.from('teams').update({ league_team_id: ltIds[i] }).eq('id', tid)
          : Promise.resolve()
      )
    )
  }

  // 4. Record the season linking championship + tournament
  await supabase.from('seasons').insert({
    league_id: leagueId,
    tournament_id: t.id,
    name: seasonName.trim() || 'Сезон 1',
    status: 'active',
  })

  revalidatePath('/dashboard')
  return { leagueId, tournamentId: t.id, teamIds: tournamentTeamIds }
}

// Returns the championship's persistent team names (for prefilling the season wizard).
export async function getChampionshipTeams(leagueId: string): Promise<{ name: string; logo_url: string | null }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('league_teams')
    .select('name, logo_url')
    .eq('league_id', leagueId)
    .order('created_at')
  return (data ?? []) as { name: string; logo_url: string | null }[]
}

// ── Championship-wide player statistics ───────────────────────────────────────
// Aggregates match events across ALL seasons of a championship. Season teams are
// linked to persistent championship teams via teams.league_team_id, so a player's
// numbers carry over between seasons (Flashscore model).
export type ChampPlayerStat = {
  player: string
  playerId: string | null
  teamName: string
  teamSlug: string | null
  teamLogo: string | null
  photo: string | null
  goals: number
  assists: number
  yellow: number
  red: number
  matchesPlayed: number
  seasons: number
}

export type ChampTeamStat = {
  teamName: string
  teamSlug: string | null
  logo: string | null
  seasons: number
  GP: number
  W: number
  D: number
  L: number
  GF: number
  GA: number
  GD: number
  Pts: number
}

export async function getChampionshipPlayerStats(leagueId: string): Promise<ChampPlayerStat[]> {
  const supabase = await createClient()

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, tournament_id')
    .eq('league_id', leagueId)
  const tournamentIds = (seasons ?? []).map(s => s.tournament_id).filter((x): x is string => !!x)
  if (tournamentIds.length === 0) return []

  const [{ data: seasonTeams }, { data: leagueTeams }, { data: fixtures }, { data: playoffMatches }] = await Promise.all([
    supabase.from('teams').select('id, name, tournament_id, league_team_id').in('tournament_id', tournamentIds),
    supabase.from('league_teams').select('id, name, logo_url, slug').eq('league_id', leagueId),
    supabase.from('fixtures').select('id, tournament_id, played').in('tournament_id', tournamentIds),
    supabase.from('playoff_matches').select('id, tournament_id').in('tournament_id', tournamentIds),
  ])

  // Player photos (best-effort — photo_url is optional before migration 028).
  const leagueTeamIds = (leagueTeams ?? []).map(lt => lt.id)
  const { data: rosterPlayers } = leagueTeamIds.length
    ? await supabase.from('players').select('*').in('league_team_id', leagueTeamIds)
    : { data: [] as { name: string; league_team_id: string; photo_url?: string | null }[] }
  // key: `${leagueTeamId}|${name.toLowerCase()}` → photo_url / player id (for links)
  const photoByKey = new Map<string, string | null>()
  const idByKey = new Map<string, string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (rosterPlayers ?? []) as any[]) {
    if (p.league_team_id && p.name) {
      const k = `${p.league_team_id}|${String(p.name).toLowerCase()}`
      photoByKey.set(k, p.photo_url ?? null)
      if (p.id) idByKey.set(k, p.id as string)
    }
  }
  const leagueTeamLogo = new Map((leagueTeams ?? []).map(lt => [lt.id, lt.logo_url ?? null]))
  const leagueTeamSlug = new Map((leagueTeams ?? []).map(lt => [lt.id, (lt as { slug?: string | null }).slug ?? null]))

  const fixtureIds = (fixtures ?? []).map(f => f.id)
  const playoffIds = (playoffMatches ?? []).map(m => m.id)
  if (fixtureIds.length === 0 && playoffIds.length === 0) return []

  type EvRow = { team_id: string; player_name: string; type: string; fixture_id?: string | null; playoff_match_id?: string | null }
  const [{ data: fixtureEvents }, { data: playoffEvents }] = await Promise.all([
    fixtureIds.length
      ? supabase.from('match_events').select('team_id, player_name, type, fixture_id').in('fixture_id', fixtureIds)
      : Promise.resolve({ data: [] as EvRow[] }),
    playoffIds.length
      ? supabase.from('match_events').select('team_id, player_name, type, playoff_match_id').in('playoff_match_id', playoffIds)
      : Promise.resolve({ data: [] as EvRow[] }),
  ])

  // team (season) id → persistent championship team + tournament (season) id
  const teamInfo = new Map<string, { leagueTeamId: string | null; name: string; tournamentId: string }>()
  for (const t of seasonTeams ?? []) teamInfo.set(t.id, { leagueTeamId: t.league_team_id, name: t.name, tournamentId: t.tournament_id })
  const leagueTeamName = new Map((leagueTeams ?? []).map(lt => [lt.id, lt.name]))

  type Acc = ChampPlayerStat & { seasonSet: Set<string>; matchSet: Set<string> }
  const acc = new Map<string, Acc>()

  const events = [...(fixtureEvents ?? []), ...(playoffEvents ?? [])] as EvRow[]
  for (const e of events) {
    const info = teamInfo.get(e.team_id)
    if (!info) continue
    const player = e.player_name.trim()
    if (!player) continue
    // Group by persistent championship team when linked, else by season team name
    const teamKey = info.leagueTeamId ?? `name:${info.name.toLowerCase()}`
    const teamName = info.leagueTeamId ? (leagueTeamName.get(info.leagueTeamId) ?? info.name) : info.name
    const key = `${teamKey}|${player.toLowerCase()}`
    let row = acc.get(key)
    if (!row) {
      const teamLogo = info.leagueTeamId ? (leagueTeamLogo.get(info.leagueTeamId) ?? null) : null
      const photo = info.leagueTeamId ? (photoByKey.get(`${info.leagueTeamId}|${player.toLowerCase()}`) ?? null) : null
      const playerId = info.leagueTeamId ? (idByKey.get(`${info.leagueTeamId}|${player.toLowerCase()}`) ?? null) : null
      const teamSlug = info.leagueTeamId ? (leagueTeamSlug.get(info.leagueTeamId) ?? null) : null
      row = { player, playerId, teamName, teamSlug, teamLogo, photo, goals: 0, assists: 0, yellow: 0, red: 0, matchesPlayed: 0, seasons: 0, seasonSet: new Set(), matchSet: new Set() }
      acc.set(key, row)
    }
    row.seasonSet.add(info.tournamentId)
    const matchId = e.fixture_id ?? e.playoff_match_id
    if (matchId) row.matchSet.add(matchId)
    if (e.type === 'goal') row.goals++
    else if (e.type === 'assist') row.assists++
    else if (e.type === 'yellow_card') row.yellow++
    else if (e.type === 'red_card') row.red++
  }

  // ── Accurate appearances from match lineups ────────────────────────────────
  // A player "played" a match if they were named in the starting lineup for a
  // played fixture — this catches players who appeared but recorded no goal /
  // assist / card, which the event scan above misses entirely. Union with the
  // event-derived matches keeps playoff appearances (lineups exist only for
  // round-robin fixtures) and subs who scored.
  const playedFixtures = new Set((fixtures ?? []).filter(f => f.played).map(f => f.id))
  const seasonTeamIds = (seasonTeams ?? []).map(t => t.id)
  if (seasonTeamIds.length && playedFixtures.size) {
    const [{ data: lineups }, { data: roster }] = await Promise.all([
      supabase.from('match_lineups').select('fixture_id, team_id, player_id, role').in('team_id', seasonTeamIds),
      supabase.from('team_players').select('id, name, team_id').in('team_id', seasonTeamIds),
    ])
    const rosterName = new Map((roster ?? []).map(p => [p.id, (p.name ?? '').trim()]))
    for (const ln of lineups ?? []) {
      if (ln.role !== 'starter' || !playedFixtures.has(ln.fixture_id)) continue
      const info = teamInfo.get(ln.team_id)
      if (!info) continue
      const name = rosterName.get(ln.player_id) ?? ''
      if (!name) continue
      const teamKey = info.leagueTeamId ?? `name:${info.name.toLowerCase()}`
      const teamName = info.leagueTeamId ? (leagueTeamName.get(info.leagueTeamId) ?? info.name) : info.name
      const key = `${teamKey}|${name.toLowerCase()}`
      let row = acc.get(key)
      if (!row) {
        const teamLogo = info.leagueTeamId ? (leagueTeamLogo.get(info.leagueTeamId) ?? null) : null
        const photo = info.leagueTeamId ? (photoByKey.get(`${info.leagueTeamId}|${name.toLowerCase()}`) ?? null) : null
        const playerId = info.leagueTeamId ? (idByKey.get(`${info.leagueTeamId}|${name.toLowerCase()}`) ?? null) : null
        const teamSlug = info.leagueTeamId ? (leagueTeamSlug.get(info.leagueTeamId) ?? null) : null
        row = { player: name, playerId, teamName, teamSlug, teamLogo, photo, goals: 0, assists: 0, yellow: 0, red: 0, matchesPlayed: 0, seasons: 0, seasonSet: new Set(), matchSet: new Set() }
        acc.set(key, row)
      }
      row.seasonSet.add(info.tournamentId)
      row.matchSet.add(ln.fixture_id)
    }
  }

  return [...acc.values()]
    .map(({ seasonSet, matchSet, ...r }) => ({ ...r, seasons: seasonSet.size, matchesPlayed: matchSet.size }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.player.localeCompare(b.player))
}

// Team-level statistics across all championship seasons (played matches only).
export async function getChampionshipTeamStats(leagueId: string): Promise<ChampTeamStat[]> {
  const supabase = await createClient()
  const { data: seasons } = await supabase.from('seasons').select('id, tournament_id').eq('league_id', leagueId)
  const tournamentIds = (seasons ?? []).map(s => s.tournament_id).filter((x): x is string => !!x)
  if (tournamentIds.length === 0) return []

  const [{ data: seasonTeams }, { data: leagueTeams }, { data: tourns }, { data: fixtures }] = await Promise.all([
    supabase.from('teams').select('id, name, tournament_id, league_team_id').in('tournament_id', tournamentIds),
    supabase.from('league_teams').select('id, name, logo_url, slug').eq('league_id', leagueId),
    supabase.from('tournaments').select('id, points_win, points_draw, points_loss').in('id', tournamentIds),
    supabase.from('fixtures').select('tournament_id, home_team_id, away_team_id, home_score, away_score, played, is_bye').in('tournament_id', tournamentIds),
  ])

  const teamInfo = new Map<string, { leagueTeamId: string | null; name: string }>()
  for (const t of seasonTeams ?? []) teamInfo.set(t.id, { leagueTeamId: t.league_team_id, name: t.name })
  const leagueTeamName = new Map((leagueTeams ?? []).map(lt => [lt.id, lt.name]))
  const leagueTeamLogo = new Map((leagueTeams ?? []).map(lt => [lt.id, lt.logo_url ?? null]))
  const leagueTeamSlug = new Map((leagueTeams ?? []).map(lt => [lt.id, (lt as { slug?: string | null }).slug ?? null]))
  const cfg = new Map((tourns ?? []).map(t => [t.id, { pw: t.points_win ?? 3, pd: t.points_draw ?? 1, pl: t.points_loss ?? 0 }]))

  type Acc = ChampTeamStat & { seasonSet: Set<string> }
  const acc = new Map<string, Acc>()
  function rowFor(seasonTeamId: string): Acc | null {
    const info = teamInfo.get(seasonTeamId)
    if (!info) return null
    const key = info.leagueTeamId ?? `name:${info.name.toLowerCase()}`
    let r = acc.get(key)
    if (!r) {
      r = {
        teamName: info.leagueTeamId ? (leagueTeamName.get(info.leagueTeamId) ?? info.name) : info.name,
        teamSlug: info.leagueTeamId ? (leagueTeamSlug.get(info.leagueTeamId) ?? null) : null,
        logo: info.leagueTeamId ? (leagueTeamLogo.get(info.leagueTeamId) ?? null) : null,
        seasons: 0, GP: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0, seasonSet: new Set(),
      }
      acc.set(key, r)
    }
    return r
  }

  for (const f of fixtures ?? []) {
    if (f.is_bye || !f.played || f.home_score == null || f.away_score == null || !f.home_team_id || !f.away_team_id) continue
    const c = cfg.get(f.tournament_id) ?? { pw: 3, pd: 1, pl: 0 }
    const home = rowFor(f.home_team_id), away = rowFor(f.away_team_id)
    const hs = f.home_score, as = f.away_score
    if (home) { home.seasonSet.add(f.tournament_id); home.GP++; home.GF += hs; home.GA += as; if (hs > as) { home.W++; home.Pts += c.pw } else if (hs === as) { home.D++; home.Pts += c.pd } else { home.L++; home.Pts += c.pl } }
    if (away) { away.seasonSet.add(f.tournament_id); away.GP++; away.GF += as; away.GA += hs; if (as > hs) { away.W++; away.Pts += c.pw } else if (as === hs) { away.D++; away.Pts += c.pd } else { away.L++; away.Pts += c.pl } }
  }

  return [...acc.values()]
    .map(({ seasonSet, ...r }) => ({ ...r, seasons: seasonSet.size, GD: r.GF - r.GA }))
    .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
}

// Quick "add season" — no wizard. Clones the latest season's format/settings and
// the championship's persistent teams into a brand-new season, then returns the new
// tournament id so the client can open it. This is the championship model: the user
// configured everything once; a new season just re-runs it.
export async function addSeasonQuick(leagueId: string, lang: 'ru' | 'kz' | 'en' = 'ru'): Promise<{ tournamentId?: string; error?: string }> {
  const { error: authErr, supabase, userId } = await requireEnterprise()
  if (authErr || !supabase || !userId) return { error: authErr ?? 'Требуется Enterprise' }

  const { data: league } = await supabase.from('leagues').select('name, owner_id, sport, season_period, created_at').eq('id', leagueId).single()
  if (!league || league.owner_id !== userId) return { error: 'Нет доступа' }

  // Newest season's tournament = the template for format + rules.
  const { data: seasons } = await supabase
    .from('seasons')
    .select('name, tournament_id, created_at')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })

  const latest = (seasons ?? []).find(s => s.tournament_id) ?? null
  let format: 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff' | 'swiss' | 'leaderboard' | 'double_elim' = 'round_robin'
  let numRounds = 1
  let settings: ChampSettings = { sport: league.sport ?? undefined }

  if (latest?.tournament_id) {
    const { data: tmpl } = await supabase.from('tournaments').select('*').eq('id', latest.tournament_id).single()
    if (tmpl) {
      format = (tmpl.format ?? 'round_robin') as typeof format
      numRounds = tmpl.num_rounds ?? 1
      settings = {
        matchPeriods: tmpl.match_periods ?? undefined,
        extraTime: tmpl.extra_time ?? undefined,
        matchDurationMins: tmpl.match_duration_mins ?? undefined,
        pointsWin: tmpl.points_win ?? undefined,
        pointsDraw: tmpl.points_draw ?? undefined,
        pointsLoss: tmpl.points_loss ?? undefined,
        groupsCount: tmpl.groups_count ?? undefined,
        teamsAdvance: tmpl.teams_advance ?? undefined,
        sport: tmpl.sport ?? league.sport ?? undefined,
        playoffBestOf: (tmpl as { playoff_best_of?: number }).playoff_best_of ?? undefined,
        playoffTwoLegged: (tmpl as { playoff_two_legged?: boolean }).playoff_two_legged ?? undefined,
      }
    }
  }

  const teams = await getChampionshipTeams(leagueId)
  const teamNames = teams.map(t => t.name)
  if (teamNames.length < 2) return { error: 'Сначала добавьте минимум 2 команды в настройках чемпионата' }

  // Logical next name from the championship's periodicity (migration 027).
  const period = ((league as { season_period?: string }).season_period as SeasonPeriod) ?? 'seasonal'
  const anchor = (league as { created_at?: string }).created_at ?? new Date().toISOString()
  const newName = computeSeasonName(period, anchor, (seasons ?? []).length, lang)

  // Previous seasons are NOT auto-finished — the owner ends a season manually
  // (button) or it ends when all its matches are played.
  const res = await addSeasonWithSetup(leagueId, format, numRounds, teamNames, newName, settings)
  if (res.error) return { error: res.error }
  return { tournamentId: res.tournamentId }
}

// Add a new season to an existing championship, reusing its persistent teams.
export async function addSeasonWithSetup(
  leagueId: string,
  format: 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff' | 'swiss' | 'leaderboard' | 'double_elim',
  numRounds: number,
  teamNames: string[],
  seasonName: string,
  settings?: ChampSettings,
): Promise<{ tournamentId?: string; teamIds?: string[]; error?: string }> {
  const { error: authErr, supabase, userId } = await requireEnterprise()
  if (authErr || !supabase || !userId) return { error: authErr ?? 'Требуется Enterprise' }

  const { data: league } = await supabase.from('leagues').select('name, owner_id').eq('id', leagueId).single()
  if (!league || league.owner_id !== userId) return { error: 'Нет доступа' }

  const validNames = teamNames.map(n => n.trim()).filter(Boolean)

  // Create the season tournament (named after the championship)
  const t = await createTournamentWithSetup(league.name, format, numRounds, teamNames, settings)
  if (t.error || !t.id) return { error: t.error ?? 'Ошибка создания сезона' }
  const tournamentTeamIds = t.teamIds ?? []

  // Map each season team to a persistent championship team (reuse existing by name, create if new)
  const { data: existingLT } = await supabase.from('league_teams').select('id, name').eq('league_id', leagueId)
  const byName = new Map<string, string>((existingLT ?? []).map((r: { id: string; name: string }) => [r.name.toLowerCase(), r.id]))

  const linkOps = validNames.map(async (n, i) => {
    let ltId = byName.get(n.toLowerCase())
    if (!ltId) {
      const { data: created } = await supabase
        .from('league_teams')
        .insert({ league_id: leagueId, name: n, slug: teamSlug(n) || n.slice(0, 20).toLowerCase() })
        .select('id').single()
      ltId = created?.id
    }
    const tid = tournamentTeamIds[i]
    if (ltId && tid) await supabase.from('teams').update({ league_team_id: ltId }).eq('id', tid)
  })
  await Promise.all(linkOps)

  await supabase.from('seasons').insert({
    league_id: leagueId,
    tournament_id: t.id,
    name: seasonName.trim() || 'Новый сезон',
    status: 'active',
  })

  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return { tournamentId: t.id, teamIds: tournamentTeamIds }
}
