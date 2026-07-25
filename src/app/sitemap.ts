import { createClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'
import { APP_URL } from '@/lib/appUrl'
import { SPORT_SEO } from '@/lib/sportSeo'

// A sitemap file may hold at most 50 000 URLs. These caps keep us inside that
// budget with room to spare; when any of them starts binding, split the sitemap
// per entity type behind a sitemap index.
const LIMITS = { tournaments: 2000, leagues: 500, teams: 2000, players: 5000, matches: 5000 }

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
  let matches: { id: string; tournament_id: string }[] = []
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

    const [{ data: playerRows }, { data: matchRows }] = await Promise.all([
      teamIds.length
        ? supabase.from('players').select('id, league_team_id').in('league_team_id', teamIds).limit(LIMITS.players)
        : Promise.resolve({ data: [] as typeof players }),
      tournamentIds.length
        ? supabase.from('fixtures').select('id, tournament_id').in('tournament_id', tournamentIds).eq('played', true).eq('is_bye', false).limit(LIMITS.matches)
        : Promise.resolve({ data: [] as typeof matches }),
    ])
    players = (playerRows ?? []) as typeof players
    matches = (matchRows ?? []) as typeof matches
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

  const tournamentUrls: MetadataRoute.Sitemap = (tournaments ?? []).map(t => ({
    url: `${APP_URL}/t/${t.slug ?? t.id}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const leagueUrls: MetadataRoute.Sitemap = publicLeagues.flatMap(l => [
    { url: `${APP_URL}/leagues/${l.slug}`, lastModified: new Date(l.created_at), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${APP_URL}/leagues/${l.slug}/players`, lastModified: new Date(l.created_at), changeFrequency: 'weekly' as const, priority: 0.5 },
  ])

  const teamUrls: MetadataRoute.Sitemap = teams
    .map(t => {
      const leagueSlug = leagueSlugById.get(t.league_id)
      return leagueSlug
        ? { url: `${APP_URL}/leagues/${leagueSlug}/teams/${t.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 }
        : null
    })
    .filter((u): u is NonNullable<typeof u> => !!u)

  const playerUrls: MetadataRoute.Sitemap = players
    .map(p => {
      const team = teamById.get(p.league_team_id)
      const leagueSlug = team ? leagueSlugById.get(team.league_id) : undefined
      return leagueSlug
        ? { url: `${APP_URL}/leagues/${leagueSlug}/players/${p.id}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.5 }
        : null
    })
    .filter((u): u is NonNullable<typeof u> => !!u)

  const matchUrls: MetadataRoute.Sitemap = matches
    .map(m => {
      const leagueId = leagueIdByTournament.get(m.tournament_id)
      const leagueSlug = leagueId ? leagueSlugById.get(leagueId) : undefined
      return leagueSlug
        ? { url: `${APP_URL}/leagues/${leagueSlug}/matches/${m.id}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.4 }
        : null
    })
    .filter((u): u is NonNullable<typeof u> => !!u)

  return [...marketing, ...leagueUrls, ...tournamentUrls, ...teamUrls, ...playerUrls, ...matchUrls]
}
