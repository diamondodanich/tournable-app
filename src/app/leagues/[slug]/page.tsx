import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Team, Fixture } from '@/types'
import { getSportTheme } from '@/lib/sports'
import LeaguePublicView from './LeaguePublicView'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tournable.app'

type Lang = 'ru' | 'kz' | 'en'

async function getLang(): Promise<Lang> {
  const v = (await cookies()).get('lang')?.value
  return v === 'kz' || v === 'en' ? v : 'ru'
}

const SPORT_LABELS: Record<Lang, Record<string, string>> = {
  ru: { football: 'Футбол', futsal: 'Футзал', efootball: 'Киберфутбол', basketball: 'Баскетбол', streetball: 'Стритбол', ebasketball: 'Кибербаскетбол', volleyball: 'Волейбол', beach_volleyball: 'Пляжный волейбол', hockey: 'Хоккей', other: 'Другое' },
  kz: { football: 'Футбол', futsal: 'Футзал', efootball: 'Кибер футбол', basketball: 'Баскетбол', streetball: 'Стритбол', ebasketball: 'Кибер баскетбол', volleyball: 'Волейбол', beach_volleyball: 'Пляжды волейбол', hockey: 'Хоккей', other: 'Басқа' },
  en: { football: 'Football', futsal: 'Futsal', efootball: 'eFootball', basketball: 'Basketball', streetball: 'Streetball', ebasketball: 'eBasketball', volleyball: 'Volleyball', beach_volleyball: 'Beach volleyball', hockey: 'Hockey', other: 'Other' },
}

type StandingRow = { teamId: string; name: string; GP: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }

function computeStandings(teams: Team[], fixtures: Fixture[], pw = 3, pd = 1, pl = 0): StandingRow[] {
  const map = new Map<string, StandingRow>()
  for (const t of teams) map.set(t.id, { teamId: t.id, name: t.name, GP: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 })
  for (const f of fixtures) {
    if (!f.played || f.is_bye || f.home_score == null || f.away_score == null) continue
    const home = map.get(f.home_team_id ?? '')
    const away = map.get(f.away_team_id ?? '')
    const hs = f.home_score, as = f.away_score
    if (home) { home.GP++; home.GF += hs; home.GA += as; home.GD += hs - as; if (hs > as) { home.W++; home.Pts += pw } else if (hs === as) { home.D++; home.Pts += pd } else { home.L++; home.Pts += pl } }
    if (away) { away.GP++; away.GF += as; away.GA += hs; away.GD += as - hs; if (as > hs) { away.W++; away.Pts += pw } else if (as === hs) { away.D++; away.Pts += pd } else { away.L++; away.Pts += pl } }
  }
  return [...map.values()].sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
}

type ScorerRow = { name: string; teamName: string; goals: number }

function computeScorers(events: { player_name: string; team_id: string; type: string }[], teams: Team[]): ScorerRow[] {
  const map = new Map<string, ScorerRow>()
  for (const e of events) {
    if (e.type !== 'goal') continue
    const teamName = teams.find(t => t.id === e.team_id)?.name ?? '—'
    const key = `${e.player_name}||${e.team_id}`
    const existing = map.get(key) ?? { name: e.player_name, teamName, goals: 0 }
    existing.goals++
    map.set(key, existing)
  }
  return [...map.values()].sort((a, b) => b.goals - a.goals).slice(0, 30)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const supabase = await createClient()
  const { slug } = await params
  const { data: l } = await supabase.from('leagues').select('name, description, sport, city, meta_title, meta_description').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (!l) return { title: 'Лига не найдена' }
  const sport = l.sport ? SPORT_LABELS[await getLang()][l.sport] : null
  const title = l.meta_title ?? `${l.name}${sport ? ` — ${sport}` : ''}${l.city ? ` (${l.city})` : ''}`
  const description = l.meta_description ?? l.description ?? `Турнирная таблица, команды и история сезонов — ${l.name}.`
  return {
    title, description,
    alternates: { canonical: `/leagues/${slug}` },
    openGraph: { title, description, type: 'website', url: `${APP_URL}/leagues/${slug}` },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function LeaguePublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ season?: string }>
}) {
  const supabase = await createClient()
  const { slug } = await params
  const { season: seasonParam } = await searchParams

  const { data: league } = await supabase
    .from('leagues').select('*').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (!league) notFound()

  const [{ data: seasonsRaw }, { data: leagueTeamsRaw }] = await Promise.all([
    supabase.from('seasons').select('*').eq('league_id', league.id).order('created_at', { ascending: false }),
    supabase.from('league_teams').select('*').eq('league_id', league.id).order('name'),
  ])

  const allSeasons = (seasonsRaw ?? []) as { id: string; name: string; status: string; tournament_id: string | null }[]
  const leagueTeams = (leagueTeamsRaw ?? []) as { id: string; name: string; slug: string; city: string | null }[]

  const activeSeasons = allSeasons.filter(s => s.status === 'active')
  const selectedSeason = seasonParam
    ? allSeasons.find(s => s.id === seasonParam)
    : (activeSeasons[0] ?? allSeasons[0])
  const tournamentId = selectedSeason?.tournament_id ?? null

  let standings: StandingRow[] = []
  let scorers: ScorerRow[] = []
  let recent: { id: string; homeName: string; awayName: string; homeScore: number | null; awayScore: number | null; played: boolean }[] = []
  let upcoming: typeof recent = []

  if (tournamentId) {
    const [{ data: tournamentData }, { data: teamData }, { data: fixtureData }] = await Promise.all([
      supabase.from('tournaments').select('points_win,points_draw,points_loss').eq('id', tournamentId).maybeSingle(),
      supabase.from('teams').select('*').eq('tournament_id', tournamentId),
      supabase.from('fixtures').select('*, home_team:teams!home_team_id(id,name,logo_url), away_team:teams!away_team_id(id,name,logo_url)').eq('tournament_id', tournamentId).eq('is_bye', false).order('matchday'),
    ])

    const tournamentTeams = (teamData ?? []) as Team[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fixtures = (fixtureData ?? []) as (Fixture & { home_team: any; away_team: any })[]

    standings = computeStandings(tournamentTeams, fixtures, tournamentData?.points_win ?? 3, tournamentData?.points_draw ?? 1, tournamentData?.points_loss ?? 0)

    const toLite = (f: Fixture & { home_team: { name?: string } | null; away_team: { name?: string } | null }) => ({
      id: f.id, homeName: f.home_team?.name ?? '—', awayName: f.away_team?.name ?? '—',
      homeScore: f.home_score, awayScore: f.away_score, played: f.played,
    })
    recent = fixtures.filter(f => f.played).slice(-5).reverse().map(toLite)
    upcoming = fixtures.filter(f => !f.played).slice(0, 5).map(toLite)

    // Scorers fetched upfront so switching to the tab is instant.
    const { data: fixtureIds } = await supabase.from('fixtures').select('id').eq('tournament_id', tournamentId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fids = (fixtureIds ?? []).map((f: any) => f.id as string)
    if (fids.length > 0) {
      const { data: eventsData } = await supabase.from('match_events').select('player_name,team_id,type').in('fixture_id', fids)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scorers = computeScorers((eventsData ?? []) as any[], tournamentTeams)
    }
  }

  const lang = await getLang()
  const sportLabel = league.sport ? SPORT_LABELS[lang][league.sport] ?? null : null
  const brand = getSportTheme(league.sport).primary

  return (
    <LeaguePublicView
      league={{ name: league.name, logo_url: league.logo_url, sport: league.sport, city: league.city, description: league.description, slug }}
      brand={brand}
      sportLabel={sportLabel}
      seasons={allSeasons.map(s => ({ id: s.id, name: s.name, status: s.status }))}
      selectedSeasonId={selectedSeason?.id ?? null}
      tournamentId={tournamentId}
      standings={standings}
      scorers={scorers}
      recent={recent}
      upcoming={upcoming}
      leagueTeams={leagueTeams}
      lang={lang}
    />
  )
}
