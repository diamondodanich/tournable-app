import { createClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'
import { APP_URL } from '@/lib/appUrl'
import { SPORT_SEO } from '@/lib/sportSeo'

// A sitemap file may hold at most 50 000 URLs, and every entity is listed three
// times (ru / kz / en), so the effective budget per entity is a third of that.
// These caps keep the total near 30 000; when any of them starts binding, split
// the sitemap per entity type behind a sitemap index.
const LIMITS = { tournaments: 1500, leagues: 500, teams: 1500, players: 3000, matches: 3000 }

/** The three localized variants of a marketing path, cross-linked via hreflang. */
function trilingual(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], lastModified: Date): MetadataRoute.Sitemap {
  // The home path is '/', so a prefixed variant must not end up as '/kz/' — that
  // is a different URL from the '/kz' the page declares as its canonical.
  const url = (prefix: string) => `${APP_URL}${prefix}${prefix && path === '/' ? '' : path}`
  const languages = { ru: url(''), kk: url('/kz'), en: url('/en') }
  return (['', '/kz', '/en'] as const).map(prefix => ({
    url: url(prefix),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const now = new Date()

  const [{ data: tournaments }, { data: leagues }] = await Promise.all([
    supabase
      .from('tournaments')
      .select('id, slug, updated_at')
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(LIMITS.tournaments),
    supabase
      .from('leagues')
      .select('id, slug, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(LIMITS.leagues),
  ])

  const publicLeagues = leagues ?? []
  const leagueIds = publicLeagues.map(l => l.id as string)
  const leagueSlugById = new Map(publicLeagues.map(l => [l.id as string, l.slug as string]))

  // Championship sub-pages: teams, players and match reports. Everything is
  // scoped to public leagues — private championships must not leak through here.
  let teams: { id: string; slug: string; league_id: string }[] = []
  let players: { id: string; league_team_id: string }[] = []
  let matches: { id: string; tournament_id: string; played_at: string | null }[] = []
  let leagueIdByTournament = new Map<string, string>()

  if (leagueIds.length > 0) {
    const [{ data: teamRows }, { data: seasonRows }] = await Promise.all([
      supabase.from('league_teams').select('id, slug, league_id').in('league_id', leagueIds).limit(LIMITS.teams),
      supabase.from('seasons').select('tournament_id, league_id').in('league_id', leagueIds),
    ])
    teams = (teamRows ?? []) as typeof teams

    leagueIdByTournament = new Map(
      (seasonRows ?? [])
        .filter(s => s.tournament_id)
        .map(s => [s.tournament_id as string, s.league_id as string])
    )

    const teamIds = teams.map(t => t.id)
    const tournamentIds = [...leagueIdByTournament.keys()]

    // `played_at` arrives with migration 046. Selecting a column that does not
    // exist fails the whole query, which would silently drop every match URL
    // from the sitemap — so fall back to the columns that are always there.
    const playedFixtures = async () => {
      if (!tournamentIds.length) return [] as typeof matches
      const query = (columns: string) => supabase
        .from('fixtures').select(columns)
        .in('tournament_id', tournamentIds)
        .eq('played', true).eq('is_bye', false).limit(LIMITS.matches)
      const { data, error } = await query('id, tournament_id, played_at')
      if (!error) return (data ?? []) as unknown as typeof matches
      const { data: legacy } = await query('id, tournament_id')
      return ((legacy ?? []) as unknown as { id: string; tournament_id: string }[])
        .map(m => ({ ...m, played_at: null }))
    }

    const [{ data: playerRows }, matchRows] = await Promise.all([
      teamIds.length
        ? supabase.from('players').select('id, league_team_id').in('league_team_id', teamIds).limit(LIMITS.players)
        : Promise.resolve({ data: [] as typeof players }),
      playedFixtures(),
    ])
    players = (playerRows ?? []) as typeof players
    matches = matchRows
  }

  const teamById = new Map(teams.map(t => [t.id, t]))

  const marketing: MetadataRoute.Sitemap = [
    ...trilingual('/', 1, 'weekly', now),
    ...trilingual('/sports', 0.9, 'weekly', now),
    ...trilingual('/tournaments', 0.9, 'daily', now),
    ...trilingual('/leagues', 0.9, 'daily', now),
    ...SPORT_SEO.flatMap(e => trilingual(`/sports/${e.slug}`, 0.8, 'weekly', now)),
    { url: `${APP_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/terms`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${APP_URL}/privacy`, lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ]

  const tournamentUrls: MetadataRoute.Sitemap = (tournaments ?? []).flatMap(t =>
    trilingual(`/t/${t.slug ?? t.id}`, 0.7, 'weekly', new Date(t.updated_at))
  )

  const leagueUrls: MetadataRoute.Sitemap = publicLeagues.flatMap(l => [
    ...trilingual(`/leagues/${l.slug}`, 0.8, 'daily', new Date(l.created_at)),
    ...trilingual(`/leagues/${l.slug}/players`, 0.5, 'weekly', new Date(l.created_at)),
  ])

  const teamUrls: MetadataRoute.Sitemap = teams.flatMap(t => {
    const leagueSlug = leagueSlugById.get(t.league_id)
    return leagueSlug ? trilingual(`/leagues/${leagueSlug}/teams/${t.slug}`, 0.6, 'weekly', now) : []
  })

  const playerUrls: MetadataRoute.Sitemap = players.flatMap(p => {
    const team = teamById.get(p.league_team_id)
    const leagueSlug = team ? leagueSlugById.get(team.league_id) : undefined
    return leagueSlug ? trilingual(`/leagues/${leagueSlug}/players/${p.id}`, 0.5, 'weekly', now) : []
  })

  const matchUrls: MetadataRoute.Sitemap = matches.flatMap(m => {
    const leagueId = leagueIdByTournament.get(m.tournament_id)
    const leagueSlug = leagueId ? leagueSlugById.get(leagueId) : undefined
    if (!leagueSlug) return []
    // A finished match does not change again — its play date is a truthful
    // lastmod and keeps crawlers from re-fetching settled pages.
    return trilingual(
      `/leagues/${leagueSlug}/matches/${m.id}`,
      0.4, 'monthly',
      m.played_at ? new Date(m.played_at) : now,
    )
  })

  return [...marketing, ...leagueUrls, ...tournamentUrls, ...teamUrls, ...playerUrls, ...matchUrls]
}
