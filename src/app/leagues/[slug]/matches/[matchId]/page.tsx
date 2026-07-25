import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { absUrl, canonicalFor, jsonLdGraph, breadcrumbsLd, sportsEventLd } from '@/lib/seo'
import { sportDisplayName } from '@/lib/sportSeo'

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string; matchId: string }> }): Promise<Metadata> {
  const supabase = await createClient()
  const { slug, matchId } = await params
  const { data: f } = await supabase
    .from('fixtures')
    .select('tournament_id, matchday, scheduled_at, played, home_score, away_score, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
    .eq('id', matchId)
    .maybeSingle()

  if (!f) return { title: 'Матч не найден', robots: { index: false, follow: false } }
  const ctx = await getLeagueForFixture(supabase, f.tournament_id, slug)
  if (!ctx) return { title: 'Матч не найден', robots: { index: false, follow: false } }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const home = (f as any).home_team?.name ?? '?'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const away = (f as any).away_team?.name ?? '?'
  const score = f.played && f.home_score != null ? `${f.home_score}:${f.away_score}` : 'vs'
  const sport = sportDisplayName(ctx.league.sport, 'ru')
  const path = `/leagues/${slug}/matches/${matchId}`

  const title = `${home} ${score} ${away} — ${ctx.league.name}`
  const description = [
    `${home} — ${away}`,
    f.played ? `счёт ${f.home_score}:${f.away_score}.` : 'предстоящий матч.',
    sport ? `${sport},` : null,
    ctx.league.name,
    ctx.seasonName ? `· ${ctx.seasonName}` : null,
    '— состав, события матча и статистика.',
  ].filter(Boolean).join(' ')

  return {
    title,
    description,
    alternates: canonicalFor(path),
    robots: ctx.league.is_public === false ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description, type: 'article', url: absUrl(path), siteName: 'Tournable' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function MatchDetailPage({ params }: { params: Promise<{ slug: string; matchId: string }> }) {
  const supabase = await createClient()
  const { slug, matchId } = await params

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

  const home = (fixture as any).home_team
  const away = (fixture as any).away_team
  const events = ((fixture as any).match_events ?? []) as { id: string; type: string; minute: number | null; player_name: string; team_id: string }[]
  const sortedEvents = events.slice().sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  const EVENT_LABELS: Record<string, string> = {
    goal: 'Гол', own_goal: 'Автогол', assist: 'Пас', yellow_card: 'ЖК', red_card: 'КК',
  }
  const EVENT_COLORS: Record<string, string> = {
    goal: 'text-emerald-400', own_goal: 'text-red-400', assist: 'text-blue-400',
    yellow_card: 'text-yellow-400', red_card: 'text-red-500',
  }

  const matchPath = `/leagues/${slug}/matches/${matchId}`
  const scoreLabel = fixture.played && fixture.home_score != null ? `${fixture.home_score}:${fixture.away_score}` : 'vs'
  const jsonLd = jsonLdGraph(
    sportsEventLd({
      name: `${home?.name ?? '?'} ${scoreLabel} ${away?.name ?? '?'}`,
      path: matchPath,
      sport: sportDisplayName(ctx.league.sport, 'ru') ?? ctx.league.sport ?? null,
      startDate: (fixture as any).scheduled_at ?? null,
      homeName: home?.name ?? '?',
      awayName: away?.name ?? '?',
      organizerName: ctx.league.name,
      organizerPath: `/leagues/${slug}`,
    }),
    breadcrumbsLd([
      { name: 'Tournable', path: '/' },
      { name: 'Чемпионаты', path: '/leagues' },
      { name: ctx.league.name, path: `/leagues/${slug}` },
      { name: `${home?.name ?? '?'} — ${away?.name ?? '?'}`, path: matchPath },
    ]),
  )

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link href={`/leagues/${slug}`} className="text-xs text-white/30 hover:text-white/60 font-medium mb-4 inline-block">
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
              <p className="text-xs text-white/30 mt-1">тур {(fixture as any).matchday}</p>
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
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">События матча</p>
          <div className="space-y-1">
            {sortedEvents.map(e => {
              const isHome = e.team_id === home?.id
              return (
                <div key={e.id} className={`flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl ${isHome ? '' : 'flex-row-reverse'}`}>
                  {e.minute != null && (
                    <span className="text-xs font-black text-white/30 shrink-0 w-8 text-center">{e.minute}'</span>
                  )}
                  <span className={`text-xs font-bold shrink-0 ${EVENT_COLORS[e.type] ?? 'text-white/50'}`}>
                    {EVENT_LABELS[e.type] ?? e.type}
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
