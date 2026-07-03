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
export async function getSquad(leagueTeamId: string): Promise<{ name: string; number: number | null; position: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('players')
    .select('name, number, position')
    .eq('league_team_id', leagueTeamId)
    .order('number', { nullsFirst: false })
  return (data ?? []) as { name: string; number: number | null; position: string }[]
}

export async function saveSquad(
  leagueTeamId: string,
  leagueId: string,
  players: { name: string; number: number | null; position: string }[],
): Promise<{ error?: string }> {
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
    }))

  if (rows.length > 0) {
    const { error } = await supabase.from('players').insert(rows)
    if (error) return { error: error.message }
  }

  revalidatePath(`/dashboard/leagues/${leagueId}`)
  return {}
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
  seasonPeriod?: string
}

export async function createChampionshipWithSetup(
  name: string,
  format: 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff' | 'swiss',
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
  teamName: string
  goals: number
  assists: number
  yellow: number
  red: number
  seasons: number
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
    supabase.from('league_teams').select('id, name').eq('league_id', leagueId),
    supabase.from('fixtures').select('id, tournament_id').in('tournament_id', tournamentIds),
    supabase.from('playoff_matches').select('id, tournament_id').in('tournament_id', tournamentIds),
  ])

  const fixtureIds = (fixtures ?? []).map(f => f.id)
  const playoffIds = (playoffMatches ?? []).map(m => m.id)
  if (fixtureIds.length === 0 && playoffIds.length === 0) return []

  const [{ data: fixtureEvents }, { data: playoffEvents }] = await Promise.all([
    fixtureIds.length
      ? supabase.from('match_events').select('team_id, player_name, type').in('fixture_id', fixtureIds)
      : Promise.resolve({ data: [] as { team_id: string; player_name: string; type: string }[] }),
    playoffIds.length
      ? supabase.from('match_events').select('team_id, player_name, type').in('playoff_match_id', playoffIds)
      : Promise.resolve({ data: [] as { team_id: string; player_name: string; type: string }[] }),
  ])

  // team (season) id → persistent championship team + tournament (season) id
  const teamInfo = new Map<string, { leagueTeamId: string | null; name: string; tournamentId: string }>()
  for (const t of seasonTeams ?? []) teamInfo.set(t.id, { leagueTeamId: t.league_team_id, name: t.name, tournamentId: t.tournament_id })
  const leagueTeamName = new Map((leagueTeams ?? []).map(lt => [lt.id, lt.name]))

  type Acc = ChampPlayerStat & { seasonSet: Set<string> }
  const acc = new Map<string, Acc>()

  const events = [...(fixtureEvents ?? []), ...(playoffEvents ?? [])] as { team_id: string; player_name: string; type: string }[]
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
      row = { player, teamName, goals: 0, assists: 0, yellow: 0, red: 0, seasons: 0, seasonSet: new Set() }
      acc.set(key, row)
    }
    row.seasonSet.add(info.tournamentId)
    if (e.type === 'goal') row.goals++
    else if (e.type === 'assist') row.assists++
    else if (e.type === 'yellow_card') row.yellow++
    else if (e.type === 'red_card') row.red++
  }

  return [...acc.values()]
    .map(({ seasonSet, ...r }) => ({ ...r, seasons: seasonSet.size }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.player.localeCompare(b.player))
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
  let format: 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff' | 'swiss' = 'round_robin'
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

  // Mark previous seasons finished so only the newest is "active" (Flashscore model).
  await supabase.from('seasons').update({ status: 'finished' }).eq('league_id', leagueId).eq('status', 'active')

  const res = await addSeasonWithSetup(leagueId, format, numRounds, teamNames, newName, settings)
  if (res.error) return { error: res.error }
  return { tournamentId: res.tournamentId }
}

// Add a new season to an existing championship, reusing its persistent teams.
export async function addSeasonWithSetup(
  leagueId: string,
  format: 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff' | 'swiss',
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
