import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Team, Fixture } from '@/types'
import { getSportTheme } from '@/lib/sports'
import { getChampionshipPlayerStats, getChampionshipTeamStats, type ChampPlayerStat, type ChampTeamStat } from '@/app/actions/leagues'
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

type StandingRow = { teamId: string; name: string; logoUrl: string | null; href: string | null; GP: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }

function computeStandings(teams: (Team & { league_team_id?: string | null })[], fixtures: Fixture[], hrefByTeam: Map<string, string>, pw = 3, pd = 1, pl = 0): StandingRow[] {
  const map = new Map<string, StandingRow>()
  for (const t of teams) map.set(t.id, { teamId: t.id, name: t.name, logoUrl: t.logo_url ?? null, href: hrefByTeam.get(t.id) ?? null, GP: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 })
  for (const f of fixtures) {
    if (!f.played || f.is_bye || f.home_score == null || f.away_score == null) continue
    const home = map.get(f.home_team_id ?? ''), away = map.get(f.away_team_id ?? '')
    const hs = f.home_score, as = f.away_score
    if (home) { home.GP++; home.GF += hs; home.GA += as; home.GD += hs - as; if (hs > as) { home.W++; home.Pts += pw } else if (hs === as) { home.D++; home.Pts += pd } else { home.L++; home.Pts += pl } }
    if (away) { away.GP++; away.GF += as; away.GA += hs; away.GD += as - hs; if (as > hs) { away.W++; away.Pts += pw } else if (as === hs) { away.D++; away.Pts += pd } else { away.L++; away.Pts += pl } }
  }
  return [...map.values()].sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
}

type FixtureLite = { id: string; homeName: string; awayName: string; homeLogo: string | null; awayLogo: string | null; homeScore: number | null; awayScore: number | null; played: boolean; scheduledAt: string | null }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const supabase = await createClient()
  const { slug } = await params
  const { data: l } = await supabase.from('leagues').select('name, description, sport, city, meta_title, meta_description, logo_url').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (!l) return { title: 'Лига не найдена' }
  const sport = l.sport ? SPORT_LABELS[await getLang()][l.sport] : null
  const title = l.meta_title ?? `${l.name}${sport ? ` — ${sport}` : ''}${l.city ? ` (${l.city})` : ''}`
  const description = l.meta_description ?? l.description ?? `Турнирная таблица, команды и история сезонов — ${l.name}.`
  const images = l.logo_url ? [{ url: l.logo_url }] : undefined
  return {
    title, description,
    alternates: { canonical: `/leagues/${slug}` },
    openGraph: { title, description, type: 'website', url: `${APP_URL}/leagues/${slug}`, images },
    twitter: { card: 'summary_large_image', title, description, images: l.logo_url ? [l.logo_url] : undefined },
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

  const [{ data: seasonsRaw }, { data: leagueTeamsRaw }, playerStats, teamStats] = await Promise.all([
    supabase.from('seasons').select('id, name, status, tournament_id, tournaments(format)').eq('league_id', league.id).order('created_at', { ascending: false }),
    supabase.from('league_teams').select('*').eq('league_id', league.id).order('name'),
    getChampionshipPlayerStats(league.id),
    getChampionshipTeamStats(league.id),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allSeasons = ((seasonsRaw ?? []) as any[]).map(s => ({ id: s.id, name: s.name, status: s.status, tournament_id: s.tournament_id }))
  const leagueTeams = (leagueTeamsRaw ?? []) as { id: string; name: string; slug: string; city: string | null; logo_url: string | null }[]
  const leagueTeamSlug = new Map(leagueTeams.map(lt => [lt.id, lt.slug]))

  const activeSeasons = allSeasons.filter(s => s.status === 'active')
  const selectedSeason = seasonParam ? allSeasons.find(s => s.id === seasonParam) : (activeSeasons[0] ?? allSeasons[0])
  const tournamentId = selectedSeason?.tournament_id ?? null

  let standings: StandingRow[] = []
  let recent: FixtureLite[] = []
  let upcoming: FixtureLite[] = []

  if (tournamentId) {
    const [{ data: tournamentData }, { data: teamData }, { data: fixtureData }] = await Promise.all([
      supabase.from('tournaments').select('points_win,points_draw,points_loss').eq('id', tournamentId).maybeSingle(),
      supabase.from('teams').select('*').eq('tournament_id', tournamentId),
      supabase.from('fixtures').select('*, home_team:teams!home_team_id(id,name,logo_url), away_team:teams!away_team_id(id,name,logo_url)').eq('tournament_id', tournamentId).eq('is_bye', false).order('matchday'),
    ])

    const tournamentTeams = (teamData ?? []) as (Team & { league_team_id?: string | null })[]
    // href per season-team → its public team page (via the persistent league_team slug)
    const hrefByTeam = new Map<string, string>()
    for (const tt of tournamentTeams) {
      const ltSlug = tt.league_team_id ? leagueTeamSlug.get(tt.league_team_id) : undefined
      if (ltSlug) hrefByTeam.set(tt.id, `/leagues/${slug}/teams/${ltSlug}`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fixtures = (fixtureData ?? []) as (Fixture & { home_team: any; away_team: any })[]
    standings = computeStandings(tournamentTeams, fixtures, hrefByTeam, tournamentData?.points_win ?? 3, tournamentData?.points_draw ?? 1, tournamentData?.points_loss ?? 0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toLite = (f: any): FixtureLite => ({
      id: f.id, homeName: f.home_team?.name ?? '—', awayName: f.away_team?.name ?? '—',
      homeLogo: f.home_team?.logo_url ?? null, awayLogo: f.away_team?.logo_url ?? null,
      homeScore: f.home_score, awayScore: f.away_score, played: f.played, scheduledAt: f.scheduled_at ?? null,
    })
    recent = fixtures.filter(f => f.played).slice(-8).reverse().map(toLite)
    upcoming = fixtures.filter(f => !f.played).slice(0, 8).map(toLite)
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
      recent={recent}
      upcoming={upcoming}
      teamsCount={leagueTeams.length}
      playerStats={playerStats as ChampPlayerStat[]}
      teamStats={teamStats as ChampTeamStat[]}
      lang={lang}
    />
  )
}
