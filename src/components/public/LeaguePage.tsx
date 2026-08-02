// Public championship page, shared by /leagues/<slug>, /kz/leagues/<slug> and
// /en/leagues/<slug>. The language comes from the URL, never from a cookie: a
// crawler carries no cookies, so cookie-driven localization means Google only
// ever sees the Russian copy of a page that claims three hreflang variants.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Team, Fixture } from '@/types'
import { getSportTheme, type Lang } from '@/lib/sports'
import { getChampionshipPlayerStats, getChampionshipTeamStats, type ChampPlayerStat, type ChampTeamStat } from '@/app/actions/leagues'
import LeaguePublicView from '@/app/leagues/[slug]/LeaguePublicView'
import {
  jsonLdGraph, breadcrumbsLd, sportsOrganizationLd, itemListLd,
  absUrl, trilingualAlternates, langPrefix,
} from '@/lib/seo'
import { sportDisplayName } from '@/lib/sportSeo'
import { leagueMeta, NOT_FOUND_TITLE } from '@/lib/entitySeo'
import PublicShell from './PublicShell'

type StandingRow = { teamId: string; name: string; logoUrl: string | null; href: string | null; GP: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }
type FixtureLite = { id: string; homeName: string; awayName: string; homeLogo: string | null; awayLogo: string | null; homeScore: number | null; awayScore: number | null; played: boolean; scheduledAt: string | null }

const CRUMB: Record<Lang, string> = { ru: 'Чемпионаты', kz: 'Чемпионаттар', en: 'Championships' }

function computeStandings(teams: (Team & { league_team_id?: string | null })[], fixtures: Fixture[], hrefByTeam: Map<string, string>, pw = 3, pd = 1, pl = 0): StandingRow[] {
  const map = new Map<string, StandingRow>()
  for (const t of teams) map.set(t.id, { teamId: t.id, name: t.name, logoUrl: t.logo_url ?? null, href: hrefByTeam.get(t.id) ?? null, GP: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 })
  for (const f of fixtures) {
    // A fixture missing either side is a bye, however is_bye is flagged in the row:
    // legacy rows written before the bye-detection fix can carry is_bye = false.
    if (!f.played || f.is_bye || !f.home_team_id || !f.away_team_id) continue
    if (f.home_score == null || f.away_score == null) continue
    const home = map.get(f.home_team_id ?? ''), away = map.get(f.away_team_id ?? '')
    const hs = f.home_score, as = f.away_score
    if (home) { home.GP++; home.GF += hs; home.GA += as; home.GD += hs - as; if (hs > as) { home.W++; home.Pts += pw } else if (hs === as) { home.D++; home.Pts += pd } else { home.L++; home.Pts += pl } }
    if (away) { away.GP++; away.GF += as; away.GA += hs; away.GD += as - hs; if (as > hs) { away.W++; away.Pts += pw } else if (as === hs) { away.D++; away.Pts += pd } else { away.L++; away.Pts += pl } }
  }
  return [...map.values()].sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
}

export async function leagueMetadata(slug: string, lang: Lang): Promise<Metadata> {
  const supabase = await createClient()
  const { data: l } = await supabase
    .from('leagues')
    .select('name, description, sport, city, meta_title, meta_description')
    .eq('slug', slug).eq('is_public', true).maybeSingle()

  if (!l) return { title: NOT_FOUND_TITLE[lang].league, robots: { index: false, follow: false } }

  const generated = leagueMeta(lang, { name: l.name, sport: l.sport, city: l.city, description: l.description })
  // Owner-written meta wins, but only on the Russian URL: it is authored in one
  // language and would misrepresent the translated pages.
  const title = (lang === 'ru' && l.meta_title) || generated.title
  const description = (lang === 'ru' && l.meta_description) || generated.description
  const path = `/leagues/${slug}`

  return {
    title,
    description,
    alternates: trilingualAlternates(path, lang),
    openGraph: {
      title, description, type: 'website',
      url: absUrl(`${langPrefix(lang)}${path}`), siteName: 'Tournable',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function LeaguePage({
  slug, seasonParam, lang,
}: { slug: string; seasonParam?: string; lang: Lang }) {
  const supabase = await createClient()
  const prefix = langPrefix(lang)

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
    // href per season-team → its public team page, in the current language
    const hrefByTeam = new Map<string, string>()
    for (const tt of tournamentTeams) {
      const ltSlug = tt.league_team_id ? leagueTeamSlug.get(tt.league_team_id) : undefined
      if (ltSlug) hrefByTeam.set(tt.id, `${prefix}/leagues/${slug}/teams/${ltSlug}`)
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

  const brand = getSportTheme(league.sport).primary
  const leaguePath = `/leagues/${slug}`

  const jsonLd = jsonLdGraph(
    sportsOrganizationLd({
      name: league.name,
      path: `${prefix}${leaguePath}`,
      sport: sportDisplayName(league.sport, lang) ?? league.sport,
      city: league.city,
      logoUrl: league.logo_url,
      description: league.description,
    }),
    // The standings table as an ordered list — this is what Google reads when it
    // shows "positions" for a competition.
    standings.length
      ? itemListLd(standings.map(r => ({ name: r.name, path: r.href })))
      : null,
    breadcrumbsLd([
      { name: 'Tournable', path: prefix || '/' },
      { name: CRUMB[lang], path: `${prefix}/leagues` },
      { name: league.name, path: `${prefix}${leaguePath}` },
    ]),
  )

  return (
    <PublicShell lang={lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <LeaguePublicView
        league={{ name: league.name, logo_url: league.logo_url, sport: league.sport, city: league.city, description: league.description, slug }}
        brand={brand}
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
        pathPrefix={prefix}
      />
    </PublicShell>
  )
}
