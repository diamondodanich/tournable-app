// Public match report, shared by the three language URLs.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getEventDefs, type EventIcon, type Lang } from '@/lib/sports'
import { absUrl, trilingualAlternates, langPrefix, jsonLdGraph, breadcrumbsLd, sportsEventLd } from '@/lib/seo'
import { sportDisplayName } from '@/lib/sportSeo'
import { matchMeta, NOT_FOUND_TITLE } from '@/lib/entitySeo'

const T = {
  ru: { crumb: 'Чемпионаты', events: 'События матча', round: 'тур', ownGoal: 'Автогол' },
  kz: { crumb: 'Чемпионаттар', events: 'Матч оқиғалары', round: 'тур', ownGoal: 'Автогол' },
  en: { crumb: 'Championships', events: 'Match events', round: 'round', ownGoal: 'Own goal' },
} as const

// Colour per event kind, so a volleyball ace or an MMA knockdown is not painted
// with football's palette.
const EVENT_COLOR: Record<EventIcon, string> = {
  ball: 'text-emerald-400', assist: 'text-blue-400', yellow: 'text-yellow-400', red: 'text-red-500',
  warn: 'text-amber-400', foul: 'text-amber-400', ko: 'text-red-400', submission: 'text-gray-200',
  ace: 'text-sky-400', block: 'text-indigo-400', three: 'text-orange-400', strike: 'text-red-400',
  touchdown: 'text-emerald-400', run: 'text-emerald-400', star: 'text-amber-400',
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
    type === 'own_goal' ? 'text-red-400' : (EVENT_COLOR[defByType.get(type)?.icon ?? 'star'] ?? 'text-white/50')

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

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link href={`${prefix}/leagues/${slug}`} className="text-xs text-white/30 hover:text-white/60 font-medium mb-4 inline-block">
            ← {ctx.league.name}
          </Link>
          {/* The scoreline below is laid out visually; crawlers and screen readers
              still need one real heading for the page. */}
          <h1 className="sr-only">
            {home?.name ?? '?'} {scoreLabel} {away?.name ?? '?'} — {ctx.league.name}
          </h1>

          <div className="flex items-center justify-around py-6">
            <div className="text-center flex-1">
              <div className="w-14 h-14 rounded-xl bg-purple-900/50 flex items-center justify-center text-xl font-black text-purple-300 mx-auto mb-2">
                {home?.name?.slice(0, 2).toUpperCase() ?? '?'}
              </div>
              <p className="font-black text-lg">{home?.name ?? '?'}</p>
            </div>
            <div className="text-center px-6">
              {fixture.played ? (
                <p className="text-4xl font-black">{fixture.home_score} : {fixture.away_score}</p>
              ) : (
                <p className="text-2xl font-black text-white/30">vs</p>
              )}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <p className="text-xs text-white/30 mt-1">{tx.round} {(fixture as any).matchday}</p>
            </div>
            <div className="text-center flex-1">
              <div className="w-14 h-14 rounded-xl bg-purple-900/50 flex items-center justify-center text-xl font-black text-purple-300 mx-auto mb-2">
                {away?.name?.slice(0, 2).toUpperCase() ?? '?'}
              </div>
              <p className="font-black text-lg">{away?.name ?? '?'}</p>
            </div>
          </div>
        </div>
      </div>

      {sortedEvents.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">{tx.events}</p>
          <div className="space-y-1">
            {sortedEvents.map(e => {
              const isHome = e.team_id === home?.id
              return (
                <div key={e.id} className={`flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl ${isHome ? '' : 'flex-row-reverse'}`}>
                  {e.minute != null && (
                    <span className="text-xs font-black text-white/30 shrink-0 w-8 text-center">{e.minute}&apos;</span>
                  )}
                  <span className={`text-xs font-bold shrink-0 ${eventColor(e.type)}`}>
                    {eventLabel(e.type)}
                  </span>
                  <span className={`flex-1 text-sm font-bold text-white/90 ${isHome ? '' : 'text-right'}`}>
                    {e.player_name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
