// Public match report, shared by the three language URLs.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getEventDefs, type EventIcon, type Lang } from '@/lib/sports'
import { absUrl, trilingualAlternates, langPrefix, jsonLdGraph, breadcrumbsLd, sportsEventLd } from '@/lib/seo'
import { sportDisplayName } from '@/lib/sportSeo'
import { matchMeta, NOT_FOUND_TITLE } from '@/lib/entitySeo'
import PublicShell from './PublicShell'

const T = {
  ru: { crumb: 'Чемпионаты', events: 'События матча', round: 'тур', ownGoal: 'Автогол' },
  kz: { crumb: 'Чемпионаттар', events: 'Матч оқиғалары', round: 'тур', ownGoal: 'Автогол' },
  en: { crumb: 'Championships', events: 'Match events', round: 'round', ownGoal: 'Own goal' },
} as const

// Colour per event kind, so a volleyball ace or an MMA knockdown is not painted
// with football's palette. Authored light; `.dark` in globals.css flips them.
const EVENT_COLOR: Record<EventIcon, string> = {
  ball: 'text-emerald-600', assist: 'text-blue-600', yellow: 'text-yellow-600', red: 'text-red-600',
  warn: 'text-amber-600', foul: 'text-amber-600', ko: 'text-red-600', submission: 'text-gray-700',
  ace: 'text-sky-600', block: 'text-indigo-600', three: 'text-orange-600', strike: 'text-red-600',
  touchdown: 'text-emerald-600', run: 'text-emerald-600', star: 'text-amber-600',
}

/**
 * A fixture only belongs on `/leagues/<slug>/matches/...` if its tournament is a
 * season of that league. Without the check the same match resolves under every
 * league slug — duplicate URLs for one page, and other people's fixtures readable
 * through your slug.
 */
async function getLeagueForFixture(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string | null,
  slug: string,
) {
  if (!tournamentId) return null
  const { data } = await supabase
    .from('seasons')
    .select('name, leagues!inner(name, slug, sport, is_public)')
    .eq('tournament_id', tournamentId)
    .eq('leagues.slug', slug)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const league = (data as any)?.leagues
  if (!league) return null
  return { seasonName: data?.name as string | undefined, league }
}

export async function matchMetadata(slug: string, matchId: string, lang: Lang): Promise<Metadata> {
  const supabase = await createClient()
  const { data: f } = await supabase
    .from('fixtures')
    .select('tournament_id, matchday, played, home_score, away_score, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
    .eq('id', matchId)
    .maybeSingle()

  if (!f) return { title: NOT_FOUND_TITLE[lang].match, robots: { index: false, follow: false } }
  const ctx = await getLeagueForFixture(supabase, f.tournament_id, slug)
  if (!ctx) return { title: NOT_FOUND_TITLE[lang].match, robots: { index: false, follow: false } }

  const { title, description } = matchMeta(lang, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    home: (f as any).home_team?.name ?? '?',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    away: (f as any).away_team?.name ?? '?',
    played: !!f.played,
    homeScore: f.home_score,
    awayScore: f.away_score,
    leagueName: ctx.league.name,
    seasonName: ctx.seasonName ?? null,
    sport: ctx.league.sport ?? null,
  })
  const path = `/leagues/${slug}/matches/${matchId}`

  return {
    title,
    description,
    alternates: trilingualAlternates(path, lang),
    robots: ctx.league.is_public === false ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description, type: 'article', url: absUrl(`${langPrefix(lang)}${path}`), siteName: 'Tournable' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function MatchPage({
  slug, matchId, lang,
}: { slug: string; matchId: string; lang: Lang }) {
  const supabase = await createClient()
  const tx = T[lang]
  const prefix = langPrefix(lang)

  const { data: fixture } = await supabase
    .from('fixtures')
    .select(`
      *,
      home_team:teams!home_team_id(id, name),
      away_team:teams!away_team_id(id, name),
      match_events(id, type, minute, player_name, team_id)
    `)
    .eq('id', matchId)
    .maybeSingle()

  if (!fixture) notFound()

  const ctx = await getLeagueForFixture(supabase, fixture.tournament_id, slug)
  if (!ctx) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const home = (fixture as any).home_team
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const away = (fixture as any).away_team
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = ((fixture as any).match_events ?? []) as { id: string; type: string; minute: number | null; player_name: string; team_id: string }[]
  const sortedEvents = events.slice().sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  // Event names come from the discipline definition, translated, instead of a
  // hard-coded football list.
  const defByType = new Map(getEventDefs(ctx.league.sport).map(d => [d.type, d]))
  const eventLabel = (type: string) =>
    type === 'own_goal' ? tx.ownGoal : (defByType.get(type)?.label[lang] ?? type)
  const eventColor = (type: string) =>
    type === 'own_goal' ? 'text-red-600' : (EVENT_COLOR[defByType.get(type)?.icon ?? 'star'] ?? 'text-gray-500')

  // Every scorer in the timeline links to their profile. Events store a name, so
  // the squad of each side is resolved and matched on it — the same rule the
  // event form now enforces when the name is recorded.
  const playerHref = new Map<string, string>()   // `${teamId}|${lowercased name}` → path
  const teamHref = new Map<string, string>()     // season team id → public team page
  {
    const teamIds = [home?.id, away?.id].filter((x): x is string => !!x)
    if (teamIds.length) {
      const { data: seasonTeams } = await supabase
        .from('teams').select('id, league_team_id').in('id', teamIds)
      const ltIds = (seasonTeams ?? []).map(t => t.league_team_id).filter((x): x is string => !!x)
      if (ltIds.length) {
        const [{ data: lts }, { data: squads }] = await Promise.all([
          supabase.from('league_teams').select('id, slug').in('id', ltIds),
          supabase.from('players').select('id, name, league_team_id').in('league_team_id', ltIds),
        ])
        const slugByLt = new Map((lts ?? []).map(l => [l.id, l.slug as string]))
        for (const st of seasonTeams ?? []) {
          const s = st.league_team_id ? slugByLt.get(st.league_team_id) : undefined
          if (s) teamHref.set(st.id, `${prefix}/leagues/${slug}/teams/${s}`)
          for (const p of (squads ?? []).filter(p => p.league_team_id === st.league_team_id)) {
            playerHref.set(`${st.id}|${String(p.name).trim().toLowerCase()}`, `${prefix}/leagues/${slug}/players/${p.id}`)
          }
        }
      }
    }
  }

  const matchPath = `${prefix}/leagues/${slug}/matches/${matchId}`
  const scoreLabel = fixture.played && fixture.home_score != null ? `${fixture.home_score}:${fixture.away_score}` : 'vs'

  const jsonLd = jsonLdGraph(
    sportsEventLd({
      name: `${home?.name ?? '?'} ${scoreLabel} ${away?.name ?? '?'}`,
      path: matchPath,
      sport: sportDisplayName(ctx.league.sport, lang) ?? ctx.league.sport ?? null,
      // When the match actually happened beats when it was planned; both may be
      // absent for fixtures entered without a date.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      startDate: (fixture as any).played_at ?? (fixture as any).scheduled_at ?? null,
      homeName: home?.name ?? '?',
      awayName: away?.name ?? '?',
      organizerName: ctx.league.name,
      organizerPath: `${prefix}/leagues/${slug}`,
    }),
    breadcrumbsLd([
      { name: 'Tournable', path: prefix || '/' },
      { name: tx.crumb, path: `${prefix}/leagues` },
      { name: ctx.league.name, path: `${prefix}/leagues/${slug}` },
      { name: `${home?.name ?? '?'} — ${away?.name ?? '?'}`, path: matchPath },
    ]),
  )

  // Scoreline side — a link when the team maps to a public team page.
  function teamBlock(team: { id?: string; name?: string } | null) {
    const href = team?.id ? teamHref.get(team.id) : undefined
    const inner = (
      <>
        <div className="w-14 h-14 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-xl font-black text-purple-600 mx-auto mb-2">
          {team?.name?.slice(0, 2).toUpperCase() ?? '?'}
        </div>
        <p className="font-black text-lg">{team?.name ?? '?'}</p>
      </>
    )
    return href
      ? <Link href={href} className="text-center flex-1 block hover:opacity-80 transition-opacity">{inner}</Link>
      : <div className="text-center flex-1">{inner}</div>
  }

  return (
    <PublicShell lang={lang}>
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link href={`${prefix}/leagues/${slug}`} className="text-xs text-gray-400 hover:text-gray-700 font-medium mb-4 inline-block">
            ← {ctx.league.name}
          </Link>
          {/* The scoreline below is laid out visually; crawlers and screen readers
              still need one real heading for the page. */}
          <h1 className="sr-only">
            {home?.name ?? '?'} {scoreLabel} {away?.name ?? '?'} — {ctx.league.name}
          </h1>

          <div className="flex items-center justify-around py-6">
            {teamBlock(home)}
            <div className="text-center px-6">
              {fixture.played ? (
                <p className="text-4xl font-black">{fixture.home_score} : {fixture.away_score}</p>
              ) : (
                <p className="text-2xl font-black text-gray-300">vs</p>
              )}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <p className="text-xs text-gray-400 mt-1">{tx.round} {(fixture as any).matchday}</p>
            </div>
            {teamBlock(away)}
          </div>
        </div>
      </div>

      {sortedEvents.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{tx.events}</p>
          <div className="space-y-1">
            {sortedEvents.map(e => {
              const isHome = e.team_id === home?.id
              const href = playerHref.get(`${e.team_id}|${e.player_name.trim().toLowerCase()}`)
              return (
                <div key={e.id} className={`flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-100 rounded-xl ${isHome ? '' : 'flex-row-reverse'}`}>
                  {e.minute != null && (
                    <span className="text-xs font-black text-gray-400 shrink-0 w-8 text-center">{e.minute}&apos;</span>
                  )}
                  <span className={`text-xs font-bold shrink-0 ${eventColor(e.type)}`}>
                    {eventLabel(e.type)}
                  </span>
                  {href ? (
                    <Link href={href} className={`flex-1 text-sm font-bold text-purple-600 hover:underline ${isHome ? '' : 'text-right'}`}>
                      {e.player_name}
                    </Link>
                  ) : (
                    <span className={`flex-1 text-sm font-bold text-gray-900 ${isHome ? '' : 'text-right'}`}>
                      {e.player_name}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
    </PublicShell>
  )
}
